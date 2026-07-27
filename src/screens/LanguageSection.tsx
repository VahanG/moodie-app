import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  AppButton,
  AppText,
  Card,
  ModalSheet,
  SettingsRow,
  SettingsSectionHeader,
} from '../components/ui';
import { useLocalization } from '../features/localization';
import { useTheme } from '../theme';
import { useSettingsPanelStyles } from './SettingsPanel.styles';

const LanguageSection: React.FC = () => {
  const styles = useSettingsPanelStyles();
  const { theme } = useTheme();
  const { languageCode, languages, setLanguage, t } = useLocalization();
  const [isVisible, setIsVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentLanguage = useMemo(
    () => languages.find(language => language.code === languageCode),
    [languageCode, languages],
  );

  const selectLanguage = async (nextCode: string) => {
    setErrorMessage(null);
    try {
      await setLanguage(nextCode);
      setIsVisible(false);
    } catch {
      setErrorMessage(t('language.saveError'));
    }
  };

  return (
    <>
      <Card style={styles.card} variant="elevated" testID="section-language">
        <SettingsSectionHeader
          description={t('language.description')}
          icon={
            <Ionicons
              color={theme.colors.accent}
              name="language-outline"
              size={22}
            />
          }
          title={t('language.title')}
        />
        <SettingsRow
          label={currentLanguage?.nativeName ?? languageCode}
          description={currentLanguage?.englishName}
          trailing={
            <AppButton
              compact
              fullWidth={false}
              label={t('language.change')}
              onPress={() => setIsVisible(true)}
              testID="btn-change-language"
              variant="secondary"
            />
          }
        />
        {errorMessage ? (
          <AppText accessibilityLiveRegion="polite" tone="danger">
            {errorMessage}
          </AppText>
        ) : null}
      </Card>
      <ModalSheet
        closeTestID="btn-close-language-selection"
        onClose={() => setIsVisible(false)}
        testID="modal-language-selection"
        title={t('language.modalTitle')}
        visible={isVisible}
      >
        <View style={styles.languageList}>
          {languages.map(language => (
            <AppButton
              key={language.code}
              label={`${language.nativeName} · ${language.englishName}`}
              onPress={() => selectLanguage(language.code)}
              testID={`btn-language-${language.code}`}
              variant={
                language.code === languageCode ? 'primary' : 'secondary'
              }
            />
          ))}
        </View>
      </ModalSheet>
    </>
  );
};

export default LanguageSection;
