import { NativeModules, Platform } from 'react-native';

type MoodieWidgetBridge = {
  setState(payload: string): Promise<void>;
};

export async function setNativeWidgetState(payload: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const bridge = NativeModules.MoodieWidgetBridge as
    | MoodieWidgetBridge
    | undefined;
  if (!bridge) {
    return;
  }

  await bridge.setState(payload);
}
