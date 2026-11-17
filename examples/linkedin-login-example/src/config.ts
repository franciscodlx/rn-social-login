import { Platform } from 'react-native';

/**
 * `true`: sign in against examples/mock-idp, no LinkedIn app needed.
 * `false`: real LinkedIn. Fill in the two values below and run the backend
 * with PROVIDER=linkedin (see examples/linkedin-backend/.env.example).
 */
export const USE_MOCK = true;

/** Client ID of your LinkedIn app (it is public, the secret stays on the backend). */
const LINKEDIN_CLIENT_ID = '';
/** Public https URL of examples/linkedin-backend (tunnel). */
const BACKEND_PUBLIC_URL = '';

// The Android emulator reaches the host machine through 10.0.2.2.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const LOCAL_BACKEND = `http://${HOST}:4100`;

export const config = USE_MOCK
  ? {
      clientId: 'confidential-app',
      backendUrl: LOCAL_BACKEND,
      mockAuthorizationEndpoint: `http://${HOST}:4000/authorize`,
    }
  : {
      clientId: LINKEDIN_CLIENT_ID,
      backendUrl: BACKEND_PUBLIC_URL,
      mockAuthorizationEndpoint: undefined,
    };

/** Registered in the LinkedIn app; the backend forwards it to APP_CALLBACK. */
export const REDIRECT_URI = `${config.backendUrl}/auth/linkedin/callback`;
/** Where the app listens (scheme set in android/app/build.gradle). */
export const APP_CALLBACK = 'linkedinexample://callback';
