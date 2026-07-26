module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^expo/virtual/env$': '<rootDir>/test/mocks/expoVirtualEnv.js',
    '^expo-auth-session$': '<rootDir>/test/mocks/expoAuthSession.js',
    '^expo-web-browser$': '<rootDir>/test/mocks/expoWebBrowser.js',
    '^@expo/vector-icons$': '<rootDir>/test/mocks/expoVectorIcons.js',
    '^@expo/vector-icons/Ionicons$': '<rootDir>/test/mocks/expoVectorIcons.js',
    '^react-native-url-polyfill/auto$': '<rootDir>/test/mocks/emptyModule.js',
  },
};
