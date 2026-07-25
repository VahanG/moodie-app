module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^expo/virtual/env$': '<rootDir>/test/mocks/expoVirtualEnv.js',
    '^expo-auth-session$': '<rootDir>/test/mocks/expoAuthSession.js',
    '^expo-web-browser$': '<rootDir>/test/mocks/expoWebBrowser.js',
    '^react-native-url-polyfill/auto$': '<rootDir>/test/mocks/emptyModule.js',
  },
};
