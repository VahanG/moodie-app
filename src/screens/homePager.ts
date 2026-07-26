export const HOME_PAGE_COUNT = 3;

export function getHomePageIndex(offsetX: number, pageWidth: number): number {
  if (
    !Number.isFinite(offsetX) ||
    !Number.isFinite(pageWidth) ||
    pageWidth <= 0
  ) {
    return 0;
  }

  return Math.min(
    HOME_PAGE_COUNT - 1,
    Math.max(0, Math.round(offsetX / pageWidth)),
  );
}
