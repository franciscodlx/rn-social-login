import { Platform } from 'react-native';

/**
 * `true`: sign in against examples/mock-idp, no Twitch application needed.
 * `false`: real Twitch. Fill in the two values below and run the backend
 * with PROVIDER=twitch (see examples/twitch-backend/.env.example).
 */
export const USE_MOCK = true;

/** Client ID of your Twitch application (public; the secret stays on the backend). */
const TWITCH_CLIENT_ID = '';
/** Public https URL of examples/twitch-backend (tunnel). */
const BACKEND_PUBLIC_URL = '';

// The Android emulator reaches the host machine through 10.0.2.2.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const config = USE_MOCK
  ? {
      clientId: 'confidential-app',
      backendUrl: `http://${HOST}:4300`,
      mockAuthorizationEndpoint: `http://${HOST}:4000/authorize`,
    }
  : {
      clientId: TWITCH_CLIENT_ID,
      backendUrl: BACKEND_PUBLIC_URL,
      mockAuthorizationEndpoint: undefined,
    };

/** Registered in the Twitch application; the backend forwards it to APP_CALLBACK. */
export const REDIRECT_URI = `${config.backendUrl}/auth/twitch/callback`;
/** Where the app listens (scheme set in android/app/build.gradle). */
export const APP_CALLBACK = 'twitchexample://callback';
