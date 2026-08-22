import { Image } from 'react-native';
import {
  getAdjacentAffirmationImageUris,
  prefetchAffirmationImages,
} from '../src/features/affirmations/imagePrefetch';

test('selects only the immediate previous and next affirmation images', () => {
  expect(
    getAdjacentAffirmationImageUris(
      [
        'https://example.com/one.jpg',
        'https://example.com/two.jpg',
        'https://example.com/three.jpg',
        'https://example.com/four.jpg',
      ],
      0,
    ),
  ).toEqual(['https://example.com/four.jpg', 'https://example.com/two.jpg']);
});

test('deduplicates adjacent image URLs and excludes the active image', () => {
  expect(
    getAdjacentAffirmationImageUris(
      [
        'https://example.com/shared.jpg',
        'https://example.com/shared.jpg',
        'https://example.com/other.jpg',
      ],
      0,
    ),
  ).toEqual(['https://example.com/other.jpg']);
});

test('returns no more than two successfully prefetched image URLs', async () => {
  const prefetchSpy = jest.spyOn(Image, 'prefetch').mockResolvedValue(true);

  await expect(
    prefetchAffirmationImages([
      'https://example.com/one.jpg',
      'https://example.com/two.jpg',
      'https://example.com/three.jpg',
    ]),
  ).resolves.toEqual([
    'https://example.com/one.jpg',
    'https://example.com/two.jpg',
  ]);

  expect(prefetchSpy).toHaveBeenCalledTimes(2);
  expect(prefetchSpy).toHaveBeenNthCalledWith(1, 'https://example.com/one.jpg');
  expect(prefetchSpy).toHaveBeenNthCalledWith(2, 'https://example.com/two.jpg');

  prefetchSpy.mockRestore();
});

test('does not mark failed prefetches as ready', async () => {
  const prefetchSpy = jest
    .spyOn(Image, 'prefetch')
    .mockResolvedValueOnce(true)
    .mockRejectedValueOnce(new Error('network unavailable'));

  await expect(
    prefetchAffirmationImages([
      'https://example.com/ready.jpg',
      'https://example.com/failed.jpg',
    ]),
  ).resolves.toEqual(['https://example.com/ready.jpg']);

  prefetchSpy.mockRestore();
});
