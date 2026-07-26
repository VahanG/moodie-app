import { getHomePageIndex } from '../src/screens/homePager';

describe('home pager selection', () => {
  test('updates to the nearest page as a swipe crosses its midpoint', () => {
    expect(getHomePageIndex(49, 100)).toBe(0);
    expect(getHomePageIndex(51, 100)).toBe(1);
    expect(getHomePageIndex(151, 100)).toBe(2);
  });

  test('keeps the selection inside the available page range', () => {
    expect(getHomePageIndex(-100, 100)).toBe(0);
    expect(getHomePageIndex(500, 100)).toBe(2);
  });
});
