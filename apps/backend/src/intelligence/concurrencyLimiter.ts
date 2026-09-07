// Minimal semaphore/queue — no new dependency needed. Structural placeholder
// (Patch 10) so a future real LLM-backed implementation doesn't fire ~30
// simultaneous provider calls; the mock generator routes its (currently
// synchronous/instant) per-KPI work through this limiter now so the wiring
// is proven before any real provider exists.
export class ConcurrencyLimiter {
  private readonly maxConcurrent: number;
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(maxConcurrent: number) {
    if (maxConcurrent < 1) {
      throw new Error("ConcurrencyLimiter requires maxConcurrent >= 1");
    }
    this.maxConcurrent = maxConcurrent;
  }

  async run<T>(task: () => Promise<T> | T): Promise<T> {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active += 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active += 1;
        resolve();
      });
    });
  }

  private release(): void {
    this.active -= 1;
    const next = this.queue.shift();
    if (next) next();
  }
}
