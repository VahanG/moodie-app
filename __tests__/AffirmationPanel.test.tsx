import React from 'react';
import { Share } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import AffirmationPanel from '../src/screens/AffirmationPanel';
import { AffirmationTopic } from '../src/features/affirmations/types';
import { buildAffirmationLikeKey } from '../src/features/affirmations/storage';
import { ThemeProvider } from '../src/theme';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

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
