# EAS Updates

Moodie uses Expo Updates for over-the-air JavaScript and asset updates.

## Local setup

- `expo` and `expo-updates` are installed.
- Native projects are wired for Expo autolinking.
- EAS profiles live in `eas.json`.
- The app currently uses runtime version `1.0.0` and channels `development`, `preview`, and `production`.

## EAS project binding

The checked-in update URL and project ID use the placeholder UUID `00000000-0000-0000-0000-000000000000`.

Before making a real update-capable build, bind the app to an Expo project:

```sh
npm run eas:update:configure
```

That command requires `eas login` or an `EXPO_TOKEN`. It replaces the placeholder `updates.url` and `extra.eas.projectId` in `app.json`.

After binding, sync the native update metadata if EAS CLI does not do it automatically:

```sh
npx expo-updates configuration:syncnative --platform android --workflow generic
npx expo-updates configuration:syncnative --platform ios --workflow generic
```

## Publishing

Build and submit native binaries after changing native code or update configuration:

```sh
npm run eas:build:production -- --platform all
```

Publish JavaScript-only updates to the matching channel:

```sh
npm run eas:update:production -- --message "Describe the update"
```
