export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  const queue = items.map((item, index) => ({ item, index }));
  const workers = Math.min(limit, queue.length);

  const run = async (): Promise<void> => {
    const job = queue.shift();
    if (!job) return;
    results[job.index] = await mapper(job.item, job.index);
    await run();
  };

  await Promise.all(Array.from({ length: workers }, () => run()));
  return results;
}
