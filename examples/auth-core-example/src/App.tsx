import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  createPkcePair,
  createProviderLogin,
  isAvailable,
  useProviderLogin,
} from '@franciscodlx/rn-auth-core';

// The Android emulator reaches the host machine through 10.0.2.2.
const IDP = `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:4000`;

// Run it with `pnpm --filter @franciscodlx/rn-auth-core-example idp`.
const mockLogin = createProviderLogin({
  id: 'mock-idp',
  authorizationEndpoint: `${IDP}/authorize`,
  tokenEndpoint: `${IDP}/token`,
  userInfoEndpoint: `${IDP}/userinfo`,
  revocationEndpoint: `${IDP}/revoke`,
  issuer: 'http://localhost:4000',
  defaultScopes: ['openid', 'profile', 'email'],
  useNonce: true,
  mapProfile: (raw) => ({
    id: String(raw.sub),
    name: String(raw.name),
    email: String(raw.email),
  }),
});

// SHA-256("abc"), base64url: a known vector to check the native crypto.
const SHA256_ABC = 'ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0';

function useNativeSelfCheck() {
  return useMemo(() => {
    try {
      const pair = createPkcePair();
      // Re-hashing a fixed input proves the digest, the verifier proves the RNG.
      const again = createPkcePair();
      return {
        available: isAvailable(),
        verifierLength: pair.codeVerifier.length,
        challengeLength: pair.codeChallenge.length,
        random: pair.codeVerifier !== again.codeVerifier,
        error: null as string | null,
      };
    } catch (e) {
      return {
        available: false,
        verifierLength: 0,
        challengeLength: 0,
        random: false,
        error: String(e),
      };
    }
  }, []);
}

export default function App() {
  const check = useNativeSelfCheck();
  const [mode, setMode] = useState('');
  const { signIn, signOut, loading, result, error } = useProviderLogin(
    mockLogin,
    { clientId: 'example-app', redirectUri: 'rnauthcore://callback' }
  );

  const nativeOk =
    check.available &&
    check.verifierLength === 43 &&
    check.challengeLength === SHA256_ABC.length &&
    check.random;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>rn-auth-core example</Text>

      <Text testID="native-check" style={nativeOk ? styles.ok : styles.bad}>
        {nativeOk
          ? 'Native module OK (PKCE S256, system browser available)'
          : `Native module problem: ${JSON.stringify(check)}`}
      </Text>

      <Button
        testID="sign-in-code"
        label="Sign in (code for your backend)"
        onPress={() => {
          setMode('code');
          signIn();
        }}
      />
      <Button
        testID="sign-in-exchange"
        label="Sign in + exchange on device"
        onPress={() => {
          setMode('exchange');
          signIn({ exchangeCode: true });
        }}
      />
      <Button
        testID="sign-in-ephemeral"
        label="Sign in (ephemeral session)"
        onPress={() => {
          setMode('ephemeral');
          signIn({ exchangeCode: true, prefersEphemeralSession: true });
        }}
      />
      <Button
        testID="sign-out"
        label="Sign out"
        onPress={() => signOut({ token: result?.accessToken })}
      />

      {loading ? <ActivityIndicator style={styles.spacer} /> : null}

      {error ? (
        <Text testID="error" style={styles.bad}>
          {`ERROR ${error.code}: ${error.message}`}
        </Text>
      ) : null}

      {result ? (
        <View testID="result" style={styles.card}>
          <Text testID="result-status" style={styles.ok}>
            {`SIGNED IN (${mode})`}
          </Text>
          <Text style={styles.mono}>{`code: ${result.code}`}</Text>
          <Text style={styles.mono}>
            {`codeVerifier: ${result.codeVerifier?.slice(0, 12)}…`}
          </Text>
          {result.accessToken ? (
            <Text style={styles.mono}>
              {`accessToken: ${result.accessToken.slice(0, 12)}…`}
            </Text>
          ) : null}
          {result.profile ? (
            <Text testID="profile" style={styles.mono}>
              {`profile: ${JSON.stringify(result.profile)}`}
            </Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Button(props: { testID: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      testID={props.testID}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      onPress={props.onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.buttonLabel}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 72, gap: 12 },
  title: { fontSize: 22, fontWeight: '600', color: '#111' },
  ok: { color: '#0a7d32', fontWeight: '600' },
  bad: { color: '#b00020', fontWeight: '600' },
  button: {
    backgroundColor: '#1f6feb',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.7 },
  buttonLabel: { color: '#fff', fontSize: 16, textAlign: 'center' },
  spacer: { marginTop: 8 },
  card: { backgroundColor: '#f2f4f7', borderRadius: 8, padding: 12, gap: 4 },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#111',
  },
});
