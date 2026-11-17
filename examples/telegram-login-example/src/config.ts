import { Platform } from 'react-native';

/**
 * `true`: sign in against examples/mock-idp, no Telegram bot needed.
 * `false`: real Telegram. Fill in the two values below and run the backend
 * with PROVIDER=telegram (see examples/telegram-backend/.env.example).
 */
export const USE_MOCK = true;

/** Client ID shown by @BotFather → Login Widget (public; the secret stays on the backend). */
const TELEGRAM_CLIENT_ID = '';
/** Public https URL of examples/telegram-backend (tunnel). */
const BACKEND_PUBLIC_URL = '';

// The Android emulator reaches the host machine through 10.0.2.2.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const config = USE_MOCK
  ? {
      clientId: 'confidential-app',
      backendUrl: `http://${HOST}:4500`,
      mockAuthorizationEndpoint: `http://${HOST}:4000/authorize`,
    }
  : {
      clientId: TELEGRAM_CLIENT_ID,
      backendUrl: BACKEND_PUBLIC_URL,
      mockAuthorizationEndpoint: undefined,
    };

/** Added to the Allowed URLs in BotFather; the backend forwards it to APP_CALLBACK. */
export const REDIRECT_URI = `${config.backendUrl}/auth/telegram/callback`;
/** Where the app listens (scheme set in android/app/build.gradle). */
export const APP_CALLBACK = 'telegramexample://callback';

/** `phone` asks the user to share their phone number. */
export const SCOPES = ['openid', 'profile', 'phone'];
