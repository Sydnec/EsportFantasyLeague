import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { catchError, firstValueFrom } from 'rxjs';
import { DetailedPerformancesResult, GameDetail, PlayerRef } from '../adapters/game-adapter.interface';
import { RateLimiter } from '../common/rate-limiter';

/**
 * Specialized stats provider for Valorant, scraping vlr.gg directly.
 *
 * There's no official Valorant esports stats API (Riot's own has the same
 * "tournament realm" problem as LoL's Match-V5), and the community's hosted
 * `vlrggapi` instance is currently down ("free-tier limits"). Self-hosting the
 * scraping logic here avoids depending on that instance. This is best-effort,
 * unofficial, and can break if vlr.gg changes its markup — verified live once
 * against real pages (results list + match detail) while building this, but
 * should be watched for breakage over time.
 */
@Injectable()
export class VlrApiService {
  private readonly logger = new Logger(VlrApiService.name);
  private readonly baseUrl = 'https://www.vlr.gg';
  // Conservative on purpose — this is scraping, not an API; no risk of a ban. ~12 req/min.
  private readonly rateLimiter = new RateLimiter(5000);

  constructor(private readonly httpService: HttpService) {}

  async getMatchPerformances(
    pandascoreMatchId: string,
    teamAName: string | null | undefined,
    teamBName: string | null | undefined,
    scheduledAt: Date,
    players: PlayerRef[],
  ): Promise<DetailedPerformancesResult> {
    if (!teamAName || !teamBName) {
      this.logger.warn(`Missing team names for match ${pandascoreMatchId} — no performances to report.`);
      return { performances: [] };
    }

    try {
      const matchPath = await this.findMatchPath(teamAName, teamBName, scheduledAt);
      if (!matchPath) {
        this.logger.warn(`No vlr.gg match found for ${teamAName} vs ${teamBName} around ${scheduledAt.toISOString()}.`);
        return { performances: [] };
      }

      const html = await this.getHtml(matchPath);
      const $ = cheerio.load(html);

      const statsByName = this.extractPlayerStats($);
      const games = this.extractGames($, teamAName, teamBName);

      if (!statsByName.size) {
        this.logger.warn(`vlr.gg match found but no player stats extracted — no performances to report.`);
        return { performances: [], games };
      }

      // A registered roster player missing from a match we DID find almost
      // always means they were benched (e.g. Pandascore still lists them on
      // the roster but a substitute played) — real info worth 0 points, not a
      // gap to paper over with a fabricated stat line, so skip them.
      const performances = players.flatMap((player) => {
        const stats = statsByName.get(this.normalizeName(player.name));
        if (stats) return [{ esportPlayerId: player.id, rawStats: stats }];
        this.logger.log(`Player "${player.name}" has no row in this vlr.gg match — likely benched, skipping.`);
        return [];
      });

      return { performances, games };
    } catch (error: any) {
      this.logger.error(`vlr.gg lookup failed for match ${pandascoreMatchId}: ${error.message}`);
      return { performances: [] };
    }
  }

  /**
   * Scans a team+date match across vlr.gg's listings. `/matches/results` only
   * ever lists fully-decided series — a match still `running` (e.g. 3 of 5
   * maps done) never appears there, confirmed live while building the
   * live-progress poll. `/matches` (the schedule/live listing, same markup)
   * is what actually carries in-progress series, so that's tried as a
   * fallback — this also means already-finished maps within a still-running
   * series ARE reachable, since vlr.gg's match page itself is populated
   * per-map as the series goes, not just once the whole thing ends.
   */
  private async findMatchPath(teamAName: string, teamBName: string, scheduledAt: Date): Promise<string | null> {
    for (const listingPath of ['/matches/results', '/matches']) {
      const found = await this.scanListingForMatch(listingPath, teamAName, teamBName, scheduledAt);
      if (found) return found;
    }
    return null;
  }

  private async scanListingForMatch(
    listingPath: string,
    teamAName: string,
    teamBName: string,
    scheduledAt: Date,
  ): Promise<string | null> {
    const html = await this.getHtml(listingPath);
    const $ = cheerio.load(html);

    const normA = this.normalizeName(teamAName);
    const normB = this.normalizeName(teamBName);
    const targetDay = scheduledAt.toISOString().slice(0, 10);

    let currentDay: string | null = null;
    let found: string | null = null;

    $('.wf-label.mod-large, a.match-item').each((_, el) => {
      if (found) return;
      const $el = $(el);

      if ($el.hasClass('wf-label')) {
        const text = $el.clone().children().remove().end().text().trim();
        const parsed = new Date(text);
        if (!isNaN(parsed.getTime())) currentDay = parsed.toISOString().slice(0, 10);
        return;
      }

      // Only match days within ±1 of the target — vlr.gg groups are in local/ET time.
      if (currentDay && Math.abs(new Date(currentDay).getTime() - new Date(targetDay).getTime()) > 24 * 60 * 60 * 1000) {
        return;
      }

      const teamNames = $el
        .find('.match-item-vs-team-name .text-of')
        .map((__, t) => this.normalizeName($(t).text()))
        .get();

      if (teamNames.includes(normA) && teamNames.includes(normB)) {
        found = $el.attr('href') ?? null;
      }
    });

    return found;
  }

  /** Parses the "All Maps" aggregate stats table so a Bo3/Bo5 isn't triple-counted. */
  private extractPlayerStats($: cheerio.CheerioAPI): Map<string, Record<string, number>> {
    const totals = new Map<string, Record<string, number>>();

    $('.vm-stats-game[data-game-id="all"] table tbody tr').each((_, row) => {
      const $row = $(row);
      const name = this.normalizeName($row.find('td.mod-player .text-of').first().text());
      if (!name) return;

      const rating = Number($row.find('td.mod-stat').first().find('.mod-both').first().text().trim()) || 0;
      const kills = Number($row.find('td.mod-vlr-kills .mod-both').first().text().trim()) || 0;
      const deaths = Number($row.find('td.mod-vlr-deaths .mod-both').first().text().trim()) || 0;
      const assists = Number($row.find('td.mod-vlr-assists .mod-both').first().text().trim()) || 0;

      totals.set(name, { rating, kills, deaths, assists });
    });

    return totals;
  }

  /**
   * Per-map name + real round score, from each map's own stats block (as
   * opposed to the `data-game-id="all"` aggregate used for player stats).
   * Best-effort: any parsing surprise on a single map just drops that map's
   * entry rather than failing the whole match.
   */
  private extractGames($: cheerio.CheerioAPI, teamAName: string, teamBName: string): GameDetail[] {
    const normA = this.normalizeName(teamAName);
    const normB = this.normalizeName(teamBName);
    const games: GameDetail[] = [];

    $('.vm-stats-game').each((_, el) => {
      const $game = $(el);
      const gameId = $game.attr('data-game-id');
      if (!gameId || gameId === 'all') return;

      try {
        const header = $game.find('.vm-stats-game-header').first();
        const teamBlocks = header.find('.team');
        if (teamBlocks.length < 2) return;

        const left = $(teamBlocks.get(0));
        const right = $(teamBlocks.get(1));
        const leftName = this.normalizeName(left.find('.team-name').first().text());
        const rightName = this.normalizeName(right.find('.team-name').first().text());
        const leftScore = Number(left.find('.score').first().text().trim());
        const rightScore = Number(right.find('.score').first().text().trim());

        const mapText = header
          .find('.map > div')
          .first()
          .find('span')
          .first()
          .clone()
          .children()
          .remove()
          .end()
          .text()
          .trim();

        // Maps not yet picked/played in a series still in progress (e.g. maps
        // 3-5 of a Bo5 where only 2 have happened) render as a "TBD" block
        // with literal "0" score text — a real, non-NaN number, so it can't be
        // filtered by the isNaN check below. Confirmed live on an in-progress
        // Bo5: unplayed slots are indistinguishable from a genuine 0-0 map by
        // score alone, only the "TBD" map name reliably marks them as unplayed.
        if (!mapText || mapText.toUpperCase() === 'TBD') return;

        let teamAScore: number | null = null;
        let teamBScore: number | null = null;
        if (leftName === normA && rightName === normB) {
          teamAScore = leftScore;
          teamBScore = rightScore;
        } else if (leftName === normB && rightName === normA) {
          teamAScore = rightScore;
          teamBScore = leftScore;
        }
        teamAScore = isNaN(teamAScore as number) ? null : teamAScore;
        teamBScore = isNaN(teamBScore as number) ? null : teamBScore;

        // Round score directly determines the map winner in Valorant, unlike
        // LoL's kill count — safe to derive winnerSide from it here.
        const winnerSide: 'A' | 'B' | null =
          teamAScore != null && teamBScore != null && teamAScore !== teamBScore ? (teamAScore > teamBScore ? 'A' : 'B') : null;

        games.push({
          id: gameId,
          position: games.length + 1,
          map: mapText || null,
          teamAScore,
          teamBScore,
          winnerSide,
        });
      } catch (error: any) {
        this.logger.warn(`Failed to parse map ${gameId} for a vlr.gg match: ${error.message}`);
      }
    });

    return games;
  }

  private async getHtml(path: string): Promise<string> {
    const { data } = await this.rateLimiter.schedule(() =>
      firstValueFrom(
        this.httpService.get<string>(`${this.baseUrl}${path}`).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`vlr.gg request failed (${path}): ${error.message}`);
            throw error;
          }),
        ),
      ),
    );
    return data;
  }

  private normalizeName(name: string | null | undefined): string {
    return (name ?? '').trim().toLowerCase();
  }

}
