export const FETCH_ALL_PAGE_SIZE = 200;

const MAX_PAGES_SCANNED = 100;

export interface PageSlice<T> {
  items: T[];
  totalPages: number;
}

export async function fetchAllPages<T>(
  loadPage: (page: number, pageSize: number) => Promise<PageSlice<T>>,
  pageSize: number = FETCH_ALL_PAGE_SIZE,
): Promise<T[]> {
  const firstSlice = await loadPage(1, pageSize);
  const pageCount = Math.min(Math.max(1, firstSlice.totalPages), MAX_PAGES_SCANNED);
  if (pageCount <= 1) return firstSlice.items;

  const remainingSlices = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => loadPage(index + 2, pageSize)),
  );

  return remainingSlices.reduce<T[]>(
    (all, slice) => all.concat(slice.items),
    [...firstSlice.items],
  );
}
