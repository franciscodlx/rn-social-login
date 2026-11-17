import { Platform } from 'react-native';
import type { MercadoLibreCountry } from '@franciscodlx/react-native-mercadolibre-login';

/**
 * `true`: sign in against examples/mock-idp, no Mercado Libre app needed.
 * `false`: real Mercado Libre. Fill in the values below and run the backend
 * with PROVIDER=mercadolibre (see examples/mercadolibre-backend/.env.example).
 */
export const USE_MOCK = true;

/** App ID of your Mercado Libre application (public; the secret stays on the backend). */
const MERCADOLIBRE_CLIENT_ID = '';
/** Public https URL of examples/mercadolibre-backend (tunnel). */
const BACKEND_PUBLIC_URL = '';
/** Country of the account that will sign in. */
export const COUNTRY: MercadoLibreCountry = 'MX';

// The Android emulator reaches the host machine through 10.0.2.2.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const config = USE_MOCK
  ? {
      clientId: 'confidential-app',
      backendUrl: `http://${HOST}:4200`,
      mockAuthorizationEndpoint: `http://${HOST}:4000/authorize`,
    }
  : {
      clientId: MERCADOLIBRE_CLIENT_ID,
      backendUrl: BACKEND_PUBLIC_URL,
      mockAuthorizationEndpoint: undefined,
    };

/** Registered in the Mercado Libre application; the backend forwards it to APP_CALLBACK. */
export const REDIRECT_URI = `${config.backendUrl}/auth/mercadolibre/callback`;
/** Where the app listens (scheme set in android/app/build.gradle). */
export const APP_CALLBACK = 'meliexample://callback';
