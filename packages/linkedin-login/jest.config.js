module.exports = {
  preset: '@react-native/jest-preset',
  modulePathIgnorePatterns: ['<rootDir>/lib/'],
  // Test against the core's source, so no build step is needed first.
  moduleNameMapper: {
    '^@franciscodlxdev/rn-auth-core$': '<rootDir>/../auth-core/src/index.ts',
  },
  // The first render loads and transforms React Native: under a second locally,
  // but over the default 5 s on a CI runner shared with the other packages' jest.
  testTimeout: 20_000,
};
