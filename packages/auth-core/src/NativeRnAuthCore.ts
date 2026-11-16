import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  /** Whether the device can present a system browser auth session. */
  isAvailable(): boolean;
  /** `byteLength` cryptographically secure random bytes, base64url without padding. */
  randomBase64Url(byteLength: number): string;
  /** SHA-256 of the UTF-8 `input`, base64url without padding. */
  sha256Base64Url(input: string): string;
  /**
   * Opens `url` in the system browser and resolves with the full redirect URL
   * once the provider redirects back to `redirectUri`.
   * Rejects with code `CANCELLED`, `NOT_SUPPORTED`, `INVALID_CONFIG` or `PROVIDER_ERROR`.
   */
  openAuthSession(
    url: string,
    redirectUri: string,
    prefersEphemeralSession: boolean
  ): Promise<string>;
  /** Dismisses the auth session in progress, if any. */
  cancelAuthSession(): void;
}

// `get` instead of `getEnforcing`: the JS API reports NOT_SUPPORTED instead of
// crashing at import time when the native module is not linked (e.g. Expo Go).
export default TurboModuleRegistry.get<Spec>('RnAuthCore');
