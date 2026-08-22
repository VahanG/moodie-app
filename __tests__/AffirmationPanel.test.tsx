import React from 'react';
import { Animated, Image, Share, StyleSheet } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import AffirmationPanel from '../src/screens/AffirmationPanel';
import { AffirmationTopic } from '../src/features/affirmations/types';
import { buildAffirmationLikeKey } from '../src/features/affirmations/storage';
import { lightTheme, ThemeProvider } from '../src/theme';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

const animatedTimingSpy = jest
  .spyOn(Animated, 'timing')
  .mockImplementation((value, config) => {
    return {
      reset: jest.fn(),
      start: callback => {
        (value as Animated.Value).setValue(config.toValue as number);
        callback?.({ finished: true });
      },
      stop: jest.fn(),
    } as ReturnType<typeof Animated.timing>;
  });

afterAll(() => {
  animatedTimingSpy.mockRestore();
});

function findInteractiveNode(
  renderer: ReactTestRenderer.ReactTestRenderer,
  testID: string,
) {
  return renderer.root
    .findAll(
      node =>
        node.props.testID === testID &&
        typeof node.props.onPress === 'function',
    )
    .at(-1)!;
}

test('renders the modern Today card and keeps core actions functional', async () => {
  const topic: AffirmationTopic = {
    id: 'growth',
    name: 'Growth',
    imageUri: 'https://example.com/growth.jpg',
    affirmations: [
      {
        id: 'affirmation-1',
        imageUri: 'https://example.com/affirmation.jpg',
        text: 'You are growing every day.',
      },
    ],
  };
  const backgrounds = [
    {
      id: 'forest',
      imageUri: 'https://example.com/forest.jpg',
      tags: ['growth'],
    },
  ];
  const dailyIndex =
    Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % topic.affirmations.length;
  const activeAffirmation = topic.affirmations[dailyIndex];
  const onToggleAffirmationLike = jest.fn();
  const shareSpy = jest
    .spyOn(Share, 'share')
    .mockResolvedValue({ action: Share.sharedAction });
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <AffirmationPanel
          backgrounds={backgrounds}
          backgroundPreference={{ mode: 'free', backgroundId: null }}
          contentStatus="ready"
          likedAffirmationKeys={[buildAffirmationLikeKey(activeAffirmation.id)]}
          onBackgroundPreferenceChange={jest.fn()}
          onRetryContent={jest.fn()}
          onSelectTopics={jest.fn()}
          onToggleAffirmationLike={onToggleAffirmationLike}
          selectedTopicIds={[topic.id]}
          topics={[topic]}
        />
      </ThemeProvider>,
    );
  });

  expect(
    renderer!.root.findByProps({ testID: 'text-today-heading' }),
  ).toBeTruthy();
  expect(
    renderer!.root.findByProps({ testID: 'text-affirmation-position' }),
  ).toBeTruthy();
  expect(
    StyleSheet.flatten(
      renderer!.root.findByProps({ testID: 'screen-affirmations' }).props.style,
    ).paddingHorizontal,
  ).toBe(0);
  expect(
    StyleSheet.flatten(
      renderer!.root.findByProps({ testID: 'card-affirmation-media' }).props
        .style,
    ),
  ).toMatchObject({ borderRadius: 0, borderWidth: 0, shadowOpacity: 0 });
  expect(
    renderer!.root.findAllByProps({ testID: 'text-current-topic' }),
  ).toHaveLength(0);
  expect(
    findInteractiveNode(renderer!, 'btn-like-affirmation').props
      .accessibilityState,
  ).toMatchObject({ selected: true });

  findInteractiveNode(renderer!, 'btn-like-affirmation').props.onPress();
  await ReactTestRenderer.act(async () => {
    await findInteractiveNode(
      renderer!,
      'btn-share-affirmation',
    ).props.onPress();
  });

  expect(onToggleAffirmationLike).toHaveBeenCalledWith(activeAffirmation.id);
  expect(shareSpy).toHaveBeenCalledWith({
    message: expect.stringContaining(activeAffirmation.text),
  });

  shareSpy.mockRestore();
});

test('renders translated affirmation text without an untranslated topic label', async () => {
  const topic: AffirmationTopic = {
    id: 'selflove',
    name: null,
    imageUri: 'https://example.com/self-love.jpg',
    affirmations: [
      {
        id: 'affirmation-hy',
        imageUri: 'https://example.com/affirmation-hy.jpg',
        text: 'Հոգ տար քո մասին',
      },
    ],
  };
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <AffirmationPanel
          backgrounds={[]}
          backgroundPreference={{ mode: 'free', backgroundId: null }}
          contentStatus="ready"
          likedAffirmationKeys={[]}
          onBackgroundPreferenceChange={jest.fn()}
          onRetryContent={jest.fn()}
          onSelectTopics={jest.fn()}
          onToggleAffirmationLike={jest.fn()}
          selectedTopicIds={[]}
          topics={[topic]}
        />
      </ThemeProvider>,
    );
  });

  expect(
    renderer!.root.findByProps({ testID: 'text-affirmation' }).props.children,
  ).toBe('Հոգ տար քո մասին');
  expect(
    renderer!.root.findAllByProps({ testID: 'text-current-topic' }),
  ).toHaveLength(0);
});

test('renders a catalog background when the affirmation image is empty', async () => {
  const topic: AffirmationTopic = {
    id: 'calm',
    name: 'Calm',
    imageUri: 'https://example.com/calm.jpg',
    affirmations: [
      {
        id: 'affirmation-without-image',
        imageUri: '',
        text: 'You can take this one breath at a time.',
      },
    ],
  };
  const fallbackImageUri = 'https://example.com/fallback.jpg';
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <AffirmationPanel
          backgrounds={[
            { id: 'fallback', imageUri: fallbackImageUri, tags: ['calm'] },
          ]}
          backgroundPreference={{ mode: 'free', backgroundId: null }}
          contentStatus="ready"
          likedAffirmationKeys={[]}
          onBackgroundPreferenceChange={jest.fn()}
          onRetryContent={jest.fn()}
          onSelectTopics={jest.fn()}
          onToggleAffirmationLike={jest.fn()}
          selectedTopicIds={[]}
          topics={[topic]}
        />
      </ThemeProvider>,
    );
  });

  expect(
    renderer!.root.findByProps({ testID: 'image-affirmation-background' }).props
      .source,
  ).toEqual({ uri: fallbackImageUri });
});

test('prefetches the resolved catalog fallback for an adjacent affirmation', async () => {
  const fallbackImageUri = 'https://example.com/fallback.jpg';
  const backgrounds = [
    { id: 'fallback', imageUri: fallbackImageUri, tags: ['calm'] },
  ];
  const dailyIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 2;
  const affirmations = [
    { id: 'affirmation-1', imageUri: '', text: 'One' },
    { id: 'affirmation-2', imageUri: '', text: 'Two' },
  ];
  affirmations[dailyIndex].imageUri = 'https://example.com/active.jpg';
  const topic: AffirmationTopic = {
    id: 'calm',
    name: 'Calm',
    imageUri: '',
    affirmations,
  };
  const prefetchSpy = jest.spyOn(Image, 'prefetch').mockResolvedValue(true);

  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(
      <ThemeProvider>
        <AffirmationPanel
          backgrounds={backgrounds}
          backgroundPreference={{ mode: 'free', backgroundId: null }}
          contentStatus="ready"
          likedAffirmationKeys={[]}
          onBackgroundPreferenceChange={jest.fn()}
          onRetryContent={jest.fn()}
          onSelectTopics={jest.fn()}
          onToggleAffirmationLike={jest.fn()}
          selectedTopicIds={[]}
          topics={[topic]}
        />
      </ThemeProvider>,
    );
    await Promise.resolve();
  });

  expect(prefetchSpy).toHaveBeenCalledWith(fallbackImageUri);

  prefetchSpy.mockRestore();
});

test('keeps the previous image visible while crossfading to a new background', async () => {
  const topic: AffirmationTopic = {
    id: 'calm',
    name: 'Calm',
    imageUri: '',
    affirmations: [
      {
        id: 'affirmation-1',
        imageUri: '',
        text: 'You can move gently.',
      },
    ],
  };
  const firstBackground = {
    id: 'first',
    imageUri: 'https://example.com/first.jpg',
    tags: ['calm'],
  };
  const secondBackground = {
    id: 'second',
    imageUri: 'https://example.com/second.jpg',
    tags: ['calm'],
  };
  const renderPanel = (
    background: typeof firstBackground,
  ): React.ReactElement => (
    <ThemeProvider>
      <AffirmationPanel
        backgrounds={[background]}
        backgroundPreference={{
          mode: 'fixed',
          backgroundId: background.id,
        }}
        contentStatus="ready"
        likedAffirmationKeys={[]}
        onBackgroundPreferenceChange={jest.fn()}
        onRetryContent={jest.fn()}
        onSelectTopics={jest.fn()}
        onToggleAffirmationLike={jest.fn()}
        selectedTopicIds={[]}
        topics={[topic]}
      />
    </ThemeProvider>
  );
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(renderPanel(firstBackground));
  });

  expect(
    StyleSheet.flatten(
      renderer!.root.findByProps({ testID: 'card-affirmation-media' }).props
        .style,
    ).backgroundColor,
  ).toBe(lightTheme.colors.affirmationPlaceholder);

  const firstImage = renderer!.root.findByProps({
    testID: 'image-affirmation-background',
  });
  expect(StyleSheet.flatten(firstImage.props.style).opacity).toBe(0);

  await ReactTestRenderer.act(async () => {
    firstImage.props.onLoad();
  });
  expect(
    StyleSheet.flatten(
      renderer!.root.findByProps({
        testID: 'image-affirmation-background',
      }).props.style,
    ).opacity,
  ).toBe(1);

  await ReactTestRenderer.act(async () => {
    renderer!.update(renderPanel(secondBackground));
  });

  const visibleImage = renderer!.root.findByProps({
    testID: 'image-affirmation-background',
  });
  const incomingImage = renderer!.root.findByProps({
    testID: 'image-affirmation-background-incoming',
  });

  expect(visibleImage.props.source).toEqual({ uri: firstBackground.imageUri });
  expect(StyleSheet.flatten(visibleImage.props.style).opacity).toBe(1);
  expect(incomingImage.props.source).toEqual({
    uri: secondBackground.imageUri,
  });
  expect(
    StyleSheet.flatten(incomingImage.props.style).opacity.__getValue(),
  ).toBe(0);

  await ReactTestRenderer.act(async () => {
    incomingImage.props.onLoad();
  });

  const settledImage = renderer!.root.findByProps({
    testID: 'image-affirmation-background',
  });
  expect(StyleSheet.flatten(settledImage.props.style).opacity).toBe(1);
  expect(settledImage.props.source).toEqual({
    uri: secondBackground.imageUri,
  });

  await ReactTestRenderer.act(async () => {
    settledImage.props.onLoad();
  });

  expect(
    renderer!.root.findAllByProps({
      testID: 'image-affirmation-background-incoming',
    }),
  ).toHaveLength(0);
});

test('shows a successfully prefetched background without the neutral loading state', async () => {
  const prefetchSpy = jest.spyOn(Image, 'prefetch').mockResolvedValue(true);
  const affirmations = [
    {
      id: 'affirmation-1',
      imageUri: 'https://example.com/one.jpg',
      text: 'One',
    },
    {
      id: 'affirmation-2',
      imageUri: 'https://example.com/two.jpg',
      text: 'Two',
    },
    {
      id: 'affirmation-3',
      imageUri: 'https://example.com/three.jpg',
      text: 'Three',
    },
  ];
  const dailyIndex =
    Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % affirmations.length;
  const prefetchedAffirmation =
    affirmations[(dailyIndex + 1) % affirmations.length];
  const renderPanel = (
    activeAffirmations: typeof affirmations,
  ): React.ReactElement => (
    <ThemeProvider>
      <AffirmationPanel
        backgrounds={[]}
        backgroundPreference={{ mode: 'free', backgroundId: null }}
        contentStatus="ready"
        likedAffirmationKeys={[]}
        onBackgroundPreferenceChange={jest.fn()}
        onRetryContent={jest.fn()}
        onSelectTopics={jest.fn()}
        onToggleAffirmationLike={jest.fn()}
        selectedTopicIds={[]}
        topics={[
          {
            id: 'calm',
            name: 'Calm',
            imageUri: '',
            affirmations: activeAffirmations,
          },
        ]}
      />
    </ThemeProvider>
  );
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(renderPanel(affirmations));
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    renderer!.update(renderPanel([prefetchedAffirmation]));
  });

  const prefetchedImage = renderer!.root.findByProps({
    testID: 'image-affirmation-background',
  });
  const opacity = StyleSheet.flatten(prefetchedImage.props.style).opacity;

  expect(prefetchedImage.props.source).toEqual({
    uri: prefetchedAffirmation.imageUri,
  });
  expect(typeof opacity === 'number' ? opacity : opacity.__getValue()).toBe(1);

  prefetchSpy.mockRestore();
});
