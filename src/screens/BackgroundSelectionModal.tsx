import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { AFFIRMATION_BACKGROUNDS } from '../features/affirmations/backgrounds';
import {
  AffirmationBackground,
  AffirmationBackgroundPreference,
} from '../features/affirmations/types';
import { useHomeScreenStyles } from './HomeScreen.styles';
import {
  AppButton,
  AppText,
  AppTextField,
  ModalSheet,
  SegmentedControl,
} from '../components/ui';

type BackgroundGroup = {
  tag: string;
  items: AffirmationBackground[];
  previewItems: AffirmationBackground[];
};

type Props = {
  visible: boolean;
  backgroundPreference: AffirmationBackgroundPreference;
  onBackgroundPreferenceChange: (
    preference: AffirmationBackgroundPreference,
  ) => Promise<void> | void;
  onClose: () => void;
};

function buildBackgroundGroups(
  backgrounds: AffirmationBackground[],
): BackgroundGroup[] {
  const byTag = new Map<string, AffirmationBackground[]>();

  backgrounds.forEach(background => {
    background.tags.forEach(tag => {
      const current = byTag.get(tag) ?? [];
      current.push(background);
      byTag.set(tag, current);
    });
  });

  return Array.from(byTag.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, items]) => ({
      tag,
      items,
      previewItems: items.slice(0, 6),
    }));
}

const BackgroundSelectionModal: React.FC<Props> = ({
  visible,
  backgroundPreference,
  onBackgroundPreferenceChange,
  onClose,
}) => {
  const styles = useHomeScreenStyles();
  const [backgroundTagSearch, setBackgroundTagSearch] = useState('');
  const [selectedBackgroundTag, setSelectedBackgroundTag] = useState<
    string | null
  >(null);
  const normalizedTagSearch = backgroundTagSearch.trim().toLowerCase();
  const groupedBackgrounds = useMemo(
    () => buildBackgroundGroups(AFFIRMATION_BACKGROUNDS),
    [],
  );
  const visibleBackgroundGroups = useMemo(
    () =>
      groupedBackgrounds.filter(group =>
        normalizedTagSearch.length === 0
          ? true
          : group.tag.toLowerCase().includes(normalizedTagSearch),
      ),
    [groupedBackgrounds, normalizedTagSearch],
  );
  const selectedBackgroundGroup = useMemo(
    () =>
      visibleBackgroundGroups.find(
        group => group.tag === selectedBackgroundTag,
      ) ?? null,
    [visibleBackgroundGroups, selectedBackgroundTag],
  );
  const fixedModeFallbackBackgroundId = AFFIRMATION_BACKGROUNDS[0]?.id ?? null;

  useEffect(() => {
    if (
      selectedBackgroundTag &&
      !visibleBackgroundGroups.some(
        group => group.tag === selectedBackgroundTag,
      )
    ) {
      setSelectedBackgroundTag(null);
    }
  }, [visibleBackgroundGroups, selectedBackgroundTag]);

  const handleClose = () => {
    onClose();
    setSelectedBackgroundTag(null);
  };

  return (
    <ModalSheet
      closeTestID="btn-close-background-selection"
      onClose={handleClose}
      testID="modal-background-selection"
      title="Backgrounds"
      visible={visible}
    >
      <SegmentedControl
        accessibilityLabel="Background mode"
        onChange={mode => {
          if (mode === 'free') {
            onBackgroundPreferenceChange({
              mode: 'free',
              backgroundId: backgroundPreference.backgroundId,
            });
            return;
          }

          onBackgroundPreferenceChange({
            mode: 'fixed',
            backgroundId:
              backgroundPreference.backgroundId ??
              fixedModeFallbackBackgroundId,
          });
        }}
        options={[
          {
            label: 'Free',
            value: 'free',
            testID: 'btn-background-mode-free',
          },
          {
            label: 'Fixed',
            value: 'fixed',
            testID: 'btn-background-mode-fixed',
          },
        ]}
        testID="toggle-background-mode"
        value={backgroundPreference.mode}
      />
      <AppTextField
        label="Search backgrounds"
        value={backgroundTagSearch}
        onChangeText={value => {
          setBackgroundTagSearch(value);
          setSelectedBackgroundTag(null);
        }}
        placeholder="Try calm, ocean, or focus"
        autoCapitalize="none"
        autoCorrect={false}
        testID="input-background-tag-search"
      />
      <ScrollView
        contentContainerStyle={styles.backgroundSections}
        testID={
          selectedBackgroundGroup ? 'list-backgrounds' : 'list-background-tags'
        }
      >
        {selectedBackgroundGroup ? (
          <View style={styles.backgroundTagSection}>
            <AppButton
              compact
              fullWidth={false}
              label="Back to tags"
              onPress={() => {
                setSelectedBackgroundTag(null);
              }}
              testID="btn-background-tags-back"
              variant="ghost"
            />
            <AppText tone="accent" variant="label">
              #{selectedBackgroundGroup.tag}
            </AppText>
            <View style={styles.backgroundDetailsGrid}>
              {selectedBackgroundGroup.items.map(background => {
                const isSelected =
                  backgroundPreference.mode === 'fixed' &&
                  backgroundPreference.backgroundId === background.id;

                return (
                  <Pressable
                    key={`${selectedBackgroundGroup.tag}-${background.id}`}
                    accessibilityLabel={`Use ${background.tags.join(
                      ', ',
                    )} background`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    style={[
                      styles.backgroundDetailCard,
                      isSelected && styles.backgroundCardSelected,
                    ]}
                    onPress={() => {
                      onBackgroundPreferenceChange({
                        mode: 'fixed',
                        backgroundId: background.id,
                      });
                    }}
                    testID={`item-background-${background.id}`}
                  >
                    <Image
                      source={{ uri: background.imageUri }}
                      style={styles.backgroundCardImage}
                      resizeMode="cover"
                    />

                    {isSelected ? (
                      <View style={styles.backgroundCardOverlay}>
                        <AppText tone="onImage" variant="caption">
                          Selected
                        </AppText>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.backgroundTagGrid}>
            {visibleBackgroundGroups.map(group => (
              <Pressable
                key={group.tag}
                accessibilityRole="button"
                style={styles.backgroundTagCard}
                onPress={() => {
                  setSelectedBackgroundTag(group.tag);
                }}
                testID={`item-background-tag-${group.tag}`}
              >
                <View style={styles.backgroundTagPreviewGrid}>
                  {group.previewItems.map(background => (
                    <Image
                      key={`${group.tag}-preview-${background.id}`}
                      source={{ uri: background.imageUri }}
                      style={styles.backgroundTagPreviewImage}
                      resizeMode="cover"
                    />
                  ))}
                </View>
                <View style={styles.backgroundTagCardOverlay}>
                  <AppText tone="onImage" variant="label">
                    #{group.tag}
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>
        )}
        {visibleBackgroundGroups.length === 0 ? (
          <AppText tone="muted">
            No backgrounds found for this tag search.
          </AppText>
        ) : null}
      </ScrollView>
    </ModalSheet>
  );
};

export default BackgroundSelectionModal;
