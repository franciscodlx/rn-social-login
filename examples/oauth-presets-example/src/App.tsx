import { useState } from 'react';
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
  createPresetLogin,
  isAuthError,
  type PresetName,
  type PresetProfile,
} from '@franciscodlx/rn-oauth-presets';
import { APP_CALLBACK, providerConfig } from './config';

const PROVIDERS: { name: PresetName; label: string; color: string }[] = [
  { name: 'github', label: 'GitHub', color: '#24292f' },
  { name: 'discord', label: 'Discord', color: '#5865f2' },
  { name: 'slack', label: 'Slack', color: '#4a154b' },
  { name: 'strava', label: 'Strava', color: '#fc4c02' },
];

type Session =
  | { status: 'idle' }
  | { status: 'working' }
  | { status: 'done'; provider: string; profile: Omit<PresetProfile, 'raw'> }
  | { status: 'failed'; message: string };

async function signInWith(name: PresetName) {
  const config = providerConfig(name);
  const login = createPresetLogin(
    name,
    config.mockAuthorizationEndpoint
      ? { authorizationEndpoint: config.mockAuthorizationEndpoint }
      : {}
  );
  const result = await login.signIn({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    callbackUri: APP_CALLBACK,
  });
  // The code is useless to the app: the backend swaps it for the profile.
  const response = await fetch(`${config.backendUrl}/auth/${name}/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: result.code,
      codeVerifier: result.codeVerifier,
      nonce: result.nonce,
      redirectUri: result.redirectUri,
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `BACKEND ERROR: ${body.error_description ?? body.error ?? 'Exchange failed'}`
    );
  }
  return body as { provider: string; profile: Omit<PresetProfile, 'raw'> };
}

export default function App() {
  const [session, setSession] = useState<Session>({ status: 'idle' });
  const busy = session.status === 'working';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>OAuth presets example</Text>
      <Text style={styles.muted}>
        Providers without a client ID in src/config.ts use the local mock.
      </Text>

      {PROVIDERS.map(({ name, label, color }) => (
        <Pressable
          key={name}
          testID={`sign-in-${name}`}
          accessibilityRole="button"
          accessibilityLabel={`Sign in with ${label}`}
          disabled={busy}
          onPress={async () => {
            setSession({ status: 'working' });
            try {
              setSession({ status: 'done', ...(await signInWith(name)) });
            } catch (e) {
              setSession({
                status: 'failed',
                message: isAuthError(e)
                  ? `ERROR ${e.code}: ${e.message}`
                  : String(e),
              });
            }
          }}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: color },
            (pressed || busy) && styles.dimmed,
          ]}
        >
          <Text style={styles.buttonLabel}>
            {`Sign in with ${label}${providerConfig(name).real ? '' : ' (mock)'}`}
          </Text>
        </Pressable>
      ))}

      {busy ? <ActivityIndicator /> : null}

      {session.status === 'failed' ? (
        <Text testID="error" style={styles.bad}>
          {session.message}
        </Text>
      ) : null}

      {session.status === 'done' ? (
        <View testID="result" style={styles.card}>
          <Text style={styles.ok}>{`SIGNED IN (${session.provider})`}</Text>
          <Text style={styles.mono}>{`id: ${session.profile.id}`}</Text>
          <Text style={styles.mono}>
            {`username: ${session.profile.username}`}
          </Text>
          <Text style={styles.mono}>{`name: ${session.profile.name}`}</Text>
          <Text style={styles.mono}>{`email: ${session.profile.email}`}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 72, gap: 14 },
  title: { fontSize: 22, fontWeight: '600', color: '#111' },
  muted: { color: '#57606a' },
  ok: { color: '#0a7d32', fontWeight: '600' },
  bad: { color: '#b00020', fontWeight: '600' },
  button: { borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16 },
  dimmed: { opacity: 0.5 },
  buttonLabel: { color: '#fff', fontSize: 16, textAlign: 'center' },
  card: { backgroundColor: '#f2f4f7', borderRadius: 8, padding: 12, gap: 4 },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#111',
  },
});
