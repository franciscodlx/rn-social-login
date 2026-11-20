import { Platform } from 'react-native';
import type { PresetName } from '@franciscodlxdev/rn-oauth-presets';

/**
 * Client ID per provider. Leave one empty to try that provider against
 * examples/mock-idp; fill it in (and its secret in
 * examples/presets-backend/.env) to use the real service.
 */
const CLIENT_IDS: Record<PresetName, string> = {
  github: '',
  discord: '',
  slack: '',
  strava: '',
};
/** Public https URL of examples/presets-backend (tunnel). Needed for real providers. */
const BACKEND_PUBLIC_URL = '';

// The Android emulator reaches the host machine through 10.0.2.2.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export function providerConfig(name: PresetName) {
  const real = CLIENT_IDS[name] !== '';
  const backendUrl = real ? BACKEND_PUBLIC_URL : `http://${HOST}:4400`;
  return {
    real,
    clientId: real ? CLIENT_IDS[name] : 'confidential-app',
    backendUrl,
    /** Registered in the provider; the backend forwards it to APP_CALLBACK. */
    redirectUri: `${backendUrl}/auth/${name}/callback`,
    mockAuthorizationEndpoint: real
      ? undefined
      : `http://${HOST}:4000/authorize`,
  };
}

/** Where the app listens (scheme set in android/app/build.gradle). */
export const APP_CALLBACK = 'presetsexample://callback';
