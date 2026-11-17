import { Platform } from 'react-native';
import type { EntraNativeAuthConfig } from '@franciscodlx/react-native-entra-native-auth';

/**
 * `true`: talk to examples/mock-entra, no Microsoft tenant needed.
 * `false`: a real Microsoft Entra external tenant. Fill in the values below.
 */
export const USE_MOCK = true;

/** `contoso` for the external tenant `contoso.onmicrosoft.com`. */
const TENANT_SUBDOMAIN = '';
/** Application (client) ID of the app registration. */
const CLIENT_ID = '';

// The Android emulator reaches the host machine through 10.0.2.2.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const config: EntraNativeAuthConfig = USE_MOCK
  ? {
      tenantSubdomain: 'mock-tenant',
      clientId: 'mock-entra-client',
      baseUrl: `http://${HOST}:4700/mock-tenant`,
    }
  : { tenantSubdomain: TENANT_SUBDOMAIN, clientId: CLIENT_ID };

/** Redirect URI registered in the app, for the browser fallback. */
export const REDIRECT_URI = 'entraexample://callback';

/** What examples/mock-entra accepts, so the mock can be tried without typing. */
export const DEMO = USE_MOCK
  ? { email: 'ada@example.com', password: 'Passw0rd!', code: '12345678' }
  : { email: '', password: '', code: '' };
