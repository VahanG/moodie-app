import { loadAdminStatus } from './service';

const mockRpc = jest.fn();

jest.mock('../supabase', () => ({
  getSupabaseClient: () => ({
    rpc: mockRpc,
  }),
}));

describe('admin access service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('checks only the current authenticated user', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });

    await expect(loadAdminStatus()).resolves.toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('is_admin');
  });

  test('fails closed when the database returns a non-boolean value', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    await expect(loadAdminStatus()).resolves.toBe(false);
  });

  test('surfaces database errors instead of granting access', async () => {
    const error = new Error('Admin check unavailable');
    mockRpc.mockResolvedValue({ data: null, error });

    await expect(loadAdminStatus()).rejects.toBe(error);
  });
});
