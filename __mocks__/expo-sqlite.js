// __mocks__/expo-sqlite.js
export const openDatabaseSync = jest.fn(() => ({
  runAsync: jest.fn(),
  getAllAsync: jest.fn(() => []),
  getFirstAsync: jest.fn(() => null),
  withTransactionAsync: jest.fn(async (cb) => {
    await cb();
  }),
}));
