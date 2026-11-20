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
  createTwitchLogin,
  twitchLogin,
  useTwitchLogin,
  type TwitchProfile,
} from '@franciscodlxdev/react-native-twitch-login';
import { APP_CALLBACK, config, REDIRECT_URI, USE_MOCK } from './config';

const login = config.mockAuthorizationEndpoint
  ? createTwitchLogin({
      authorizationEndpoint: config.mockAuthorizationEndpoint,
    })
  : twitchLogin;

type Session =
  | { status: 'idle' }
  | { status: 'exchanging' }
  | { status: 'done'; profile: TwitchProfile; verified: boolean }
  | { status: 'failed'; message: string };

/** The code is useless to the app: the backend swaps it for the profile. */
async function exchangeOnBackend(body: {
  code: string;
  nonce?: string;
  redirectUri: string;
}) {
  const response = await fetch(`${config.backendUrl}/auth/twitch/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error_description ?? json.error ?? 'Exchange failed');
  }
  return json as { profile: TwitchProfile; idTokenVerified: boolean };
}

export default function App() {
  const [session, setSession] = useState<Session>({ status: 'idle' });
  const { signIn, loading, error } = useTwitchLogin(
    {
      clientId: config.clientId,
      redirectUri: REDIRECT_URI,
      callbackUri: APP_CALLBACK,
    },
    login
  );

  const busy = loading || session.status === 'exchanging';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Twitch login example</Text>
      <Text testID="mode" style={styles.muted}>
        {USE_MOCK
          ? 'Provider: local mock (no credentials)'
          : 'Provider: Twitch'}
      </Text>

      <Pressable
        testID="sign-in"
        accessibilityRole="button"
        accessibilityLabel="Sign in with Twitch"
        disabled={busy || !login.isAvailable()}
        onPress={async () => {
          setSession({ status: 'idle' });
          const result = await signIn();
          if (!result) {
            return;
          }
          setSession({ status: 'exchanging' });
          try {
            const { profile, idTokenVerified } = await exchangeOnBackend({
              code: result.code,
              nonce: result.nonce,
              redirectUri: result.redirectUri,
            });
            setSession({ status: 'done', profile, verified: idTokenVerified });
          } catch (e) {
            setSession({ status: 'failed', message: String(e) });
          }
        }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonLabel}>Sign in with Twitch</Text>
      </Pressable>

      {busy ? <ActivityIndicator /> : null}

      {error ? (
        <Text testID="error" style={styles.bad}>
          {`ERROR ${error.code}: ${error.message}`}
        </Text>
      ) : null}
      {session.status === 'failed' ? (
        <Text testID="exchange-error" style={styles.bad}>
          {`BACKEND ERROR: ${session.message}`}
        </Text>
      ) : null}

      {session.status === 'done' ? (
        <View testID="result" style={styles.card}>
          <Text style={styles.ok}>SIGNED IN</Text>
          <Text style={styles.mono}>{`id: ${session.profile.id}`}</Text>
          <Text style={styles.mono}>
            {`username: ${session.profile.username}`}
          </Text>
          <Text style={styles.mono}>{`email: ${session.profile.email}`}</Text>
          <Text style={styles.mono}>
            {`id_token + nonce verified by backend: ${session.verified}`}
          </Text>
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
  button: {
    backgroundColor: '#9146ff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.7 },
  buttonLabel: { color: '#fff', fontSize: 16, textAlign: 'center' },
  card: { backgroundColor: '#f2f4f7', borderRadius: 8, padding: 12, gap: 4 },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#111',
  },
});
