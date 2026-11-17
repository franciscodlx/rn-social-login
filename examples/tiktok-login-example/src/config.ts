import { Platform } from 'react-native';

/**
 * `true`: sign in against examples/mock-idp, no TikTok developer app needed.
 * `false`: real TikTok. Fill in the two values below and run the backend
 * with PROVIDER=tiktok (see examples/tiktok-backend/.env.example).
 */
export const USE_MOCK = true;

/** Client key of your TikTok app (public; the secret stays on the backend). */
const TIKTOK_CLIENT_KEY = '';
/** Public https URL of examples/tiktok-backend (tunnel). */
const BACKEND_PUBLIC_URL = '';

// The Android emulator reaches the host machine through 10.0.2.2.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const config = USE_MOCK
  ? {
      clientId: 'confidential-app',
      backendUrl: `http://${HOST}:4600`,
      mockAuthorizationEndpoint: `http://${HOST}:4000/authorize`,
    }
  : {
      clientId: TIKTOK_CLIENT_KEY,
      backendUrl: BACKEND_PUBLIC_URL,
      mockAuthorizationEndpoint: undefined,
    };

/** Registered in the app's Login Kit settings; the backend forwards it to APP_CALLBACK. */
export const REDIRECT_URI = `${config.backendUrl}/auth/tiktok/callback`;
/** Where the app listens (scheme set in android/app/build.gradle). */
export const APP_CALLBACK = 'tiktokexample://callback';
