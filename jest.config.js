module.exports = {
  preset: 'react-native',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.styles.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/features/notifications/bootstrap.*',
  ],
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 55,
      lines: 55,
      statements: 55,
    },
  },
  moduleNameMapper: {
    '^expo/virtual/env$': '<rootDir>/test/mocks/expoVirtualEnv.js',
    '^expo-apple-authentication$':
      '<rootDir>/test/mocks/expoAppleAuthentication.js',
    '^expo-auth-session$': '<rootDir>/test/mocks/expoAuthSession.js',
    '^expo-web-browser$': '<rootDir>/test/mocks/expoWebBrowser.js',
    '^expo-linking$': '<rootDir>/test/mocks/expoLinking.js',
    '^@expo/vector-icons$': '<rootDir>/test/mocks/expoVectorIcons.js',
    '^@expo/vector-icons/Ionicons$': '<rootDir>/test/mocks/expoVectorIcons.js',
    '^react-native-url-polyfill/auto$': '<rootDir>/test/mocks/emptyModule.js',
  },
};
