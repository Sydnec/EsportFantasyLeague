import { Game } from '@prisma/client-esport';

// Pandascore video game slugs used to scope every /{slug}/... endpoint.
// Note: these are legacy per-game endpoint prefixes and do NOT always match
// the `slug` field returned by GET /videogames (e.g. LoL is "lol" there but
// "league-of-legends" in the catalog) — verified against the live API.
export const PANDASCORE_GAME_SLUGS: Record<Game, string> = {
  [Game.LEAGUE_OF_LEGENDS]: 'lol',
  [Game.COUNTER_STRIKE]: 'csgo',
  [Game.VALORANT]: 'valorant',
  [Game.ROCKET_LEAGUE]: 'rl',
};
