export const CALENDAR_PAGE_VISIBLE = false;
export const HOME_PAGER_SWIPE_ENABLED = false;
export const HOME_SETTINGS_PAGE_INDEX = CALENDAR_PAGE_VISIBLE ? 2 : 1;
export const HOME_PAGE_COUNT = HOME_SETTINGS_PAGE_INDEX + 1;

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
