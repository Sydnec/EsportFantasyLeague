// Shared "is this match currently visible on the home page" logic — kept in one
// place so the league/tournament filter list (HomePage) always matches exactly
// what MatchesSection ("Prochains matchs") and RecentResultsSection ("Resultats
// récents") actually render. Building the filter list from a wider window than
// what's displayed makes it list leagues that have no visible matches.

export function isUpcomingOrLiveMatch(match: any): boolean {
  const now = Date.now();
  const oneDayFromNow = now + 24 * 60 * 60 * 1000;

  if (match.status === 'running') return true;
  if (match.status !== 'finished' && match.status !== 'canceled') {
    const schedTime = new Date(match.scheduledAt).getTime();
    return schedTime <= oneDayFromNow;
  }
  return false;
}

export function isRecentlyFinishedMatch(match: any): boolean {
  if (match.status !== 'finished') return false;
  const now = Date.now();
  const threeHoursAgo = now - 3 * 60 * 60 * 1000;
  const finishedTime = match.finishedAt ? new Date(match.finishedAt).getTime() : new Date(match.scheduledAt).getTime();
  return finishedTime >= threeHoursAgo;
}

export function isInRecentResultsWindow(matchDayDate: string): boolean {
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA');
  const jMinus2 = new Date(today);
  jMinus2.setDate(jMinus2.getDate() - 2);
  const jMinus2Str = jMinus2.toLocaleDateString('en-CA');

  const dateStr = matchDayDate.split('T')[0];
  return dateStr >= jMinus2Str && dateStr <= todayStr;
}

/** True if `match` (from a match day dated `matchDayDate`) appears in either home section. */
export function isMatchVisibleOnHome(match: any, matchDayDate: string): boolean {
  if (isUpcomingOrLiveMatch(match) || isRecentlyFinishedMatch(match)) return true;
  if ((match.status === 'finished' || match.status === 'canceled') && isInRecentResultsWindow(matchDayDate)) {
    return true;
  }
  return false;
}
