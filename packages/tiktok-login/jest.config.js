module.exports = {
  preset: '@react-native/jest-preset',
  modulePathIgnorePatterns: ['<rootDir>/lib/'],
  // Test against the core's source, so no build step is needed first.
  moduleNameMapper: {
    '^@franciscodlxdev/rn-auth-core$': '<rootDir>/../auth-core/src/index.ts',
  },
};
