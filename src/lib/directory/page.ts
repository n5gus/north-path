export const DIRECTORY_PAGE_SIZE = 12;

export function directoryPage<T>(items: readonly T[], page: number, pageSize = DIRECTORY_PAGE_SIZE) {
  const size = Math.max(1, pageSize);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const safe = Math.min(Math.max(0, Math.floor(page) || 0), pages - 1);
  const start = total === 0 ? 0 : safe * size;
  const end = Math.min(total, start + size);
  return { page: safe, pages, start, end, total, items: items.slice(start, end) };
}
