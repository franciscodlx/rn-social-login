import { Platform } from 'react-native';

/**
 * `true`: sign in against examples/mock-idp, no X developer account needed.
 * `false`: real X. Fill in X_CLIENT_ID below.
 */
export const USE_MOCK = true;

/**
 * "Client ID" of your X app (User authentication settings → type "Native
 * App"). It is public: a native app has no client secret.
 */
const X_CLIENT_ID = '';

// The Android emulator reaches the host machine through 10.0.2.2.
const IDP = `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:4000`;

export const config = USE_MOCK
  ? {
      clientId: 'example-app',
      overrides: {
        authorizationEndpoint: `${IDP}/authorize`,
        tokenEndpoint: `${IDP}/token`,
        userInfoEndpoint: `${IDP}/2/users/me`,
        revocationEndpoint: `${IDP}/revoke`,
      },
    }
  : { clientId: X_CLIENT_ID, overrides: undefined };

/** Register it as a Callback URI in the X app (scheme set in android/app/build.gradle). */
export const REDIRECT_URI = 'xloginexample://callback';

/** Profile + email + refresh token. */
export const SCOPES = [
  'users.read',
  'tweet.read',
  'users.email',
  'offline.access',
];
