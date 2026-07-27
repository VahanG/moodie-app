import React, { ReactNode, useMemo } from 'react';
import { Modal, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { createModalSheetStyles } from './ModalSheet.styles';
import { useLocalization } from '../../features/localization';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  testID?: string;
  closeTestID?: string;
  sheetStyle?: StyleProp<ViewStyle>;
};

export const ModalSheet: React.FC<Props> = ({
  visible,
  title,
  onClose,
  children,
  testID,
  closeTestID,
  sheetStyle,
}) => {
  const { theme } = useTheme();
  const { t } = useLocalization();
  const styles = useMemo(() => createModalSheetStyles(theme), [theme]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop} testID={testID}>
        <Pressable
          accessibilityLabel={t('common.closeNamed', { title })}
          onPress={onClose}
          style={styles.dismissArea}
        />
        <View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="heading">{title}</AppText>
            <AppButton
              compact
              fullWidth={false}
              label={t('common.done')}
              onPress={onClose}
              testID={closeTestID}
              variant="ghost"
            />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
};
