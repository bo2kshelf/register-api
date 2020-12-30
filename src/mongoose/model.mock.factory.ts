export const modelMockFactory = jest.fn(() => ({
  findById: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
}));
