import NativeRnAuthCore, { type Spec } from './NativeRnAuthCore';
import { AuthError } from './errors';

export function getNativeModule(): Spec {
  if (!NativeRnAuthCore) {
    throw new AuthError(
      'NOT_SUPPORTED',
      '@franciscodlx/rn-auth-core is not linked. Rebuild the app after installing it (it does not run in Expo Go).'
    );
  }
  return NativeRnAuthCore;
}

/** Whether a system browser auth session can be presented on this device. */
export function isAvailable(): boolean {
  try {
    return NativeRnAuthCore?.isAvailable() ?? false;
  } catch {
    return false;
  }
}
