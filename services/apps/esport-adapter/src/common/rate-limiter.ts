/**
 * Serializes calls through a single queue and enforces a minimum delay
 * between the start of consecutive calls. Used to keep request rates to
 * third-party APIs/sites conservative (Leaguepedia, octane.gg, vlr.gg) —
 * none of them are ours, so staying well under any rate limit / bot
 * threshold matters more than throughput here.
 */
export class RateLimiter {
  private chain: Promise<any> = Promise.resolve();
  private nextAvailableAt = 0;

  constructor(private readonly minIntervalMs: number) {}

  schedule<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.chain.then(async () => {
      const wait = this.nextAvailableAt - Date.now();
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
      this.nextAvailableAt = Date.now() + this.minIntervalMs;
      return fn();
    });

    // Keep the queue moving even if a call fails — only `result` (returned to
    // the caller) should carry the rejection, not the shared chain.
    this.chain = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }
}
