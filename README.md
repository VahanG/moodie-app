This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

## Documentation-first workflow

- Product and engineering docs live under [`docs/`](docs/README.md).
- Update docs before or with implementation changes.
- For PRs, link impacted `docs/*.md` paths or include `No docs impact: <reason>`.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Build and run the app

Run one command from the project root. Expo CLI starts Metro, builds the native
app, installs it, and launches it on the selected emulator or simulator.

### Android

```sh
npm run android
```

### iOS

```sh
npm run ios
```

### Web

```sh
npm run web
```

Create a deployable static web build with:

```sh
npm run build:web
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

Use `npm start` only when you intentionally want to run Metro without rebuilding
the native app.

Daily local reminders are currently available on iOS and Android only. The web
app keeps the reminder setting disabled until browser push delivery is added.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
