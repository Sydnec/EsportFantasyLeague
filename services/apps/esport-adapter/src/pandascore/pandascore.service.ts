import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class PandascoreService {
  private readonly logger = new Logger(PandascoreService.name);
  private readonly baseUrl = 'https://api.pandascore.co';

  constructor(private readonly httpService: HttpService) {}

  private getHeaders() {
    return {
      Authorization: `Bearer ${process.env.PANDASCORE_API_TOKEN}`,
      Accept: 'application/json',
    };
  }

  private async get<T = any>(path: string, params: Record<string, any> = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const { data } = await firstValueFrom(
      this.httpService.get<T>(url, { headers: this.getHeaders(), params }).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(`Pandascore request failed (${url}): ${error.message}`);
          throw error;
        }),
      ),
    );
    return data;
  }

  /**
   * Full team rosters for a specific set of team IDs, via the generic (non
   * game-scoped) /teams endpoint — each returned team embeds its current
   * `players[]`, so this is one batched call instead of separately paginating
   * every player in the game (which is both unbounded and mostly irrelevant:
   * only teams with actual fixtures matter for fantasy rosters).
   */
  async getTeamRosters(teamIds: string[]): Promise<any[]> {
    if (!teamIds.length) return [];
    const results: any[] = [];
    for (let i = 0; i < teamIds.length; i += 100) {
      const chunk = teamIds.slice(i, i + 100);
      this.logger.log(`Fetching rosters for ${chunk.length} teams from Pandascore...`);
      const teams = await this.get<any[]>('/teams', { 'filter[id]': chunk.join(','), per_page: 100 });
      results.push(...teams);
    }
    return results;
  }

  /** Scheduled/not-yet-played matches — used to build upcoming match days. */
  async getUpcomingMatches(gameSlug: string, page = 1, perPage = 50): Promise<any[]> {
    this.logger.log(`Fetching ${gameSlug} upcoming matches from Pandascore...`);
    return this.get<any[]>(`/${gameSlug}/matches/upcoming`, { page, per_page: perPage, sort: 'scheduled_at' });
  }

  /** Matches currently live — without this, a match never shows as "running", it just jumps from not_started to finished. */
  async getRunningMatches(gameSlug: string, page = 1, perPage = 50): Promise<any[]> {
    this.logger.log(`Fetching ${gameSlug} running matches from Pandascore...`);
    return this.get<any[]>(`/${gameSlug}/matches/running`, { page, per_page: perPage });
  }

  /**
   * Finished matches — used to know when to pull detailed stats for scoring.
   * No `sort` param here on purpose: Pandascore's default order is already
   * most-recent-first, whereas sorting by `-end_at` puts canceled matches
   * (end_at is null for those) in an inconsistent spot and ends up mixing in
   * matches from years back within the first couple of pages.
   */
  async getPastMatches(gameSlug: string, page = 1, perPage = 50): Promise<any[]> {
    this.logger.log(`Fetching ${gameSlug} past matches from Pandascore...`);
    return this.get<any[]>(`/${gameSlug}/matches/past`, { page, per_page: perPage });
  }
}
