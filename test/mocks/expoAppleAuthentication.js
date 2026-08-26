/* global jest */

const React = require('react');
const { View } = require('react-native');

module.exports = {
  AppleAuthenticationButton: props => React.createElement(View, props),
  AppleAuthenticationButtonStyle: {
    BLACK: 0,
    WHITE: 1,
  },
  AppleAuthenticationButtonType: {
    SIGN_IN: 0,
  },
  AppleAuthenticationScope: {
    EMAIL: 0,
  },
  isAvailableAsync: jest.fn(async () => true),
  signInAsync: jest.fn(),
};
