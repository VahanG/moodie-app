import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AFFIRMATION_BACKGROUNDS } from '../features/affirmations/backgrounds';
import {
  AffirmationBackground,
  AffirmationBackgroundPreference,
} from '../features/affirmations/types';
import { useHomeScreenStyles } from './HomeScreen.styles';
import { useTheme } from '../theme';

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

function buildBackgroundGroups(backgrounds: AffirmationBackground[]): BackgroundGroup[] {
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
  const { theme } = useTheme();
  const [backgroundTagSearch, setBackgroundTagSearch] = useState('');
  const [selectedBackgroundTag, setSelectedBackgroundTag] = useState<string | null>(
    null,
  );
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
      visibleBackgroundGroups.find(group => group.tag === selectedBackgroundTag) ??
      null,
    [visibleBackgroundGroups, selectedBackgroundTag],
  );
  const fixedModeFallbackBackgroundId = AFFIRMATION_BACKGROUNDS[0]?.id ?? null;

  useEffect(() => {
    if (
      selectedBackgroundTag &&
      !visibleBackgroundGroups.some(group => group.tag === selectedBackgroundTag)
    ) {
      setSelectedBackgroundTag(null);
    }
  }, [visibleBackgroundGroups, selectedBackgroundTag]);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => {
        onClose();
        setSelectedBackgroundTag(null);
      }}
    >
      <View style={styles.topicModalBackdrop}>
        <View style={styles.topicModalSheet}>
          <View style={styles.topicModalHeader}>
            <Text style={styles.topicModalTitle}>Backgrounds</Text>
            <Pressable
              onPress={() => {
                onClose();
                setSelectedBackgroundTag(null);
              }}
            >
              <Text style={styles.topicModalCloseText}>Done</Text>
            </Pressable>
          </View>
          <View style={styles.backgroundModeRow}>
            <Pressable
              style={[
                styles.modeChip,
                backgroundPreference.mode === 'free' && styles.modeChipSelected,
              ]}
              onPress={() => {
                onBackgroundPreferenceChange({
                  mode: 'free',
                  backgroundId: backgroundPreference.backgroundId,
                });
              }}
            >
              <Text style={styles.modeChipText}>Free mode</Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeChip,
                backgroundPreference.mode === 'fixed' && styles.modeChipSelected,
              ]}
              onPress={() => {
                onBackgroundPreferenceChange({
                  mode: 'fixed',
                  backgroundId:
                    backgroundPreference.backgroundId ?? fixedModeFallbackBackgroundId,
                });
              }}
            >
              <Text style={styles.modeChipText}>Fixed mode</Text>
            </Pressable>
          </View>
          <TextInput
            value={backgroundTagSearch}
            onChangeText={value => {
              setBackgroundTagSearch(value);
              setSelectedBackgroundTag(null);
            }}
            style={styles.backgroundSearchInput}
            placeholder="Search tags (e.g. calm, ocean)"
            placeholderTextColor={theme.colors.placeholder}
            selectionColor={theme.colors.accent}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <ScrollView contentContainerStyle={styles.backgroundSections}>
            {selectedBackgroundGroup ? (
              <View style={styles.backgroundTagSection}>
                <Pressable
                  style={styles.backgroundTagBackButton}
                  onPress={() => {
                    setSelectedBackgroundTag(null);
                  }}
                >
                  <Text style={styles.backgroundTagBackButtonText}>Back to tags</Text>
                </Pressable>
                <Text style={styles.backgroundTagTitle}>#{selectedBackgroundGroup.tag}</Text>
                <View style={styles.backgroundDetailsGrid}>
                  {selectedBackgroundGroup.items.map(background => {
                    const isSelected =
                      backgroundPreference.mode === 'fixed' &&
                      backgroundPreference.backgroundId === background.id;

                    return (
                      <Pressable
                        key={`${selectedBackgroundGroup.tag}-${background.id}`}
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
                      >
                          <Image
                              source={{ uri: background.imageUri }}
                              style={styles.backgroundCardImage}
                              resizeMode="cover"
                          />

                        {isSelected ? (
                          <View style={styles.backgroundCardOverlay}>
                            <Text style={styles.topicCardSelectionText}>Selected</Text>
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
                    style={styles.backgroundTagCard}
                    onPress={() => {
                      setSelectedBackgroundTag(group.tag);
                    }}
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
                      <Text style={styles.backgroundTagCardTitle}>#{group.tag}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
            {visibleBackgroundGroups.length === 0 ? (
              <Text style={styles.backgroundEmptyState}>
                No backgrounds found for this tag search.
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default BackgroundSelectionModal;
