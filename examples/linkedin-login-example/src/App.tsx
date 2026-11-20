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
  createLinkedInLogin,
  linkedInLogin,
  LinkedInModal,
  useLinkedInLogin,
  type LinkedInProfile,
} from '@franciscodlxdev/react-native-linkedin-login';
import { APP_CALLBACK, config, REDIRECT_URI, USE_MOCK } from './config';

const login = config.mockAuthorizationEndpoint
  ? createLinkedInLogin({
      authorizationEndpoint: config.mockAuthorizationEndpoint,
    })
  : linkedInLogin;

type Session =
  | { status: 'idle' }
  | { status: 'exchanging' }
  | { status: 'done'; via: string; profile: LinkedInProfile; verified: boolean }
  | { status: 'failed'; message: string };

/** The code is useless to the app: the backend swaps it for the profile. */
async function exchangeOnBackend(code: string, redirectUri: string) {
  const response = await fetch(`${config.backendUrl}/auth/linkedin/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error_description ?? body.error ?? 'Exchange failed');
  }
  return body as { profile: LinkedInProfile; idTokenVerified: boolean };
}

export default function App() {
  const [session, setSession] = useState<Session>({ status: 'idle' });
  const { signIn, loading, error } = useLinkedInLogin(
    {
      clientId: config.clientId,
      redirectUri: REDIRECT_URI,
      callbackUri: APP_CALLBACK,
    },
    login
  );

  const finish = async (via: string, code: string) => {
    setSession({ status: 'exchanging' });
    try {
      const { profile, idTokenVerified } = await exchangeOnBackend(
        code,
        REDIRECT_URI
      );
      setSession({ status: 'done', via, profile, verified: idTokenVerified });
    } catch (e) {
      setSession({ status: 'failed', message: String(e) });
    }
  };

  const busy = loading || session.status === 'exchanging';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>LinkedIn login example</Text>
      <Text testID="mode" style={styles.muted}>
        {USE_MOCK
          ? 'Provider: local mock (no credentials)'
          : 'Provider: LinkedIn'}
      </Text>

      <Pressable
        testID="sign-in"
        accessibilityRole="button"
        accessibilityLabel="Sign in with LinkedIn"
        disabled={busy || !login.isAvailable()}
        onPress={async () => {
          setSession({ status: 'idle' });
          const result = await signIn();
          if (result) {
            await finish('hook', result.code);
          }
        }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonLabel}>Sign in with LinkedIn</Text>
      </Pressable>

      <Text style={styles.muted}>
        Compatibility layer (API of @gcou/react-native-linkedin):
      </Text>
      <LinkedInModal
        clientID={config.clientId}
        redirectUri={REDIRECT_URI}
        callbackUri={APP_CALLBACK}
        login={login}
        linkText="Legacy LinkedInModal"
        onSuccess={({ authentication_code }) => {
          if (authentication_code) {
            finish('LinkedInModal', authentication_code);
          }
        }}
        onError={(e) =>
          setSession({ status: 'failed', message: `${e.type}: ${e.message}` })
        }
      />

      {busy ? <ActivityIndicator style={styles.spacer} /> : null}

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
          <Text style={styles.ok}>{`SIGNED IN (${session.via})`}</Text>
          <Text style={styles.mono}>{`id: ${session.profile.id}`}</Text>
          <Text style={styles.mono}>{`name: ${session.profile.name}`}</Text>
          <Text style={styles.mono}>{`email: ${session.profile.email}`}</Text>
          <Text style={styles.mono}>
            {`id_token verified by backend: ${session.verified}`}
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
    backgroundColor: '#0a66c2',
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
