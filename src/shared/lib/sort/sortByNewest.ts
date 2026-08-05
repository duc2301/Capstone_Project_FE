const timeOf = (value?: string | null): number => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export function sortByNewest<T>(
  items: readonly T[],
  getDate: (item: T) => string | null | undefined,
): T[] {
  return [...items].sort((a, b) => timeOf(getDate(b)) - timeOf(getDate(a)));
}
