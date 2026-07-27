import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { UserSettingsSynchronizer } from './UserSettingsSynchronizer';

const mockSynchronizeCurrentUserSettings = jest.fn();
const mockUnsubscribe = jest.fn();
let mockAuthListener: (() => void) | null = null;

jest.mock('../supabase', () => ({
  readSupabaseConfig: () => ({ url: 'https://example.supabase.co' }),
}));

jest.mock('../auth', () => ({
  subscribeToAuthUser: (listener: () => void) => {
    mockAuthListener = listener;
    return mockUnsubscribe;
  },
}));

jest.mock('./service', () => ({
  synchronizeCurrentUserSettings: () => mockSynchronizeCurrentUserSettings(),
}));

describe('UserSettingsSynchronizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthListener = null;
    mockSynchronizeCurrentUserSettings.mockResolvedValue(undefined);
  });

  test('synchronizes on startup and after an authentication transition', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<UserSettingsSynchronizer />);
    });

    expect(mockSynchronizeCurrentUserSettings).toHaveBeenCalledTimes(1);
    expect(mockAuthListener).not.toBeNull();

    await ReactTestRenderer.act(async () => {
      mockAuthListener?.();
    });

    expect(mockSynchronizeCurrentUserSettings).toHaveBeenCalledTimes(2);

    await ReactTestRenderer.act(() => {
      renderer!.unmount();
    });
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
