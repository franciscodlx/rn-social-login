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
  createXLogin,
  TwitterSignIn,
  useXLogin,
  xLogin,
  type TwitterLoginData,
} from '@franciscodlxdev/react-native-x-login';
import { config, REDIRECT_URI, SCOPES, USE_MOCK } from './config';

const login = config.overrides ? createXLogin(config.overrides) : xLogin;

const short = (token?: string) =>
  token ? `${token.slice(0, 6)}… (${token.length} chars)` : 'none';

function Button(props: {
  id: string;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={props.id}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.button,
        (pressed || props.disabled) && styles.dimmed,
      ]}
    >
      <Text style={styles.buttonLabel}>{props.label}</Text>
    </Pressable>
  );
}

export default function App() {
  const { signIn, signOut, loading, result, error } = useXLogin(
    {
      clientId: config.clientId,
      redirectUri: REDIRECT_URI,
      scopes: SCOPES,
      exchangeCode: true,
    },
    login
  );
  // Tokens change on refresh, so they live outside the hook's result.
  const [tokens, setTokens] = useState<{ access?: string; refresh?: string }>(
    {}
  );
  const [note, setNote] = useState('');
  const [legacy, setLegacy] = useState<TwitterLoginData | null>(null);
  const [working, setWorking] = useState(false);

  const run = async (label: string, task: () => Promise<string>) => {
    setWorking(true);
    try {
      setNote(await task());
    } catch (e) {
      setNote(`${label} FAILED: ${String(e)}`);
    } finally {
      setWorking(false);
    }
  };

  const busy = loading || working;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>X login example</Text>
      <Text testID="mode" style={styles.muted}>
        {USE_MOCK ? 'Provider: local mock (no credentials)' : 'Provider: X'}
      </Text>

      <Button
        id="sign-in"
        label="Sign in with X"
        disabled={busy || !login.isAvailable()}
        onPress={async () => {
          setNote('');
          setLegacy(null);
          const next = await signIn();
          setTokens({ access: next?.accessToken, refresh: next?.refreshToken });
        }}
      />
      <Button
        id="refresh"
        label="Refresh token"
        disabled={busy || !tokens.refresh}
        onPress={() =>
          run('REFRESH', async () => {
            const next = await login.refresh({
              clientId: config.clientId,
              refreshToken: tokens.refresh!,
            });
            const rotated = next.refreshToken !== tokens.refresh;
            setTokens({
              access: next.accessToken,
              refresh: next.refreshToken ?? tokens.refresh,
            });
            return `REFRESHED (new access token: ${next.accessToken !== tokens.access}, rotated: ${rotated})`;
          })
        }
      />
      <Button
        id="sign-out"
        label="Sign out (revoke)"
        disabled={busy || !tokens.access}
        onPress={() =>
          run('SIGN OUT', async () => {
            await signOut({ token: tokens.access });
            setTokens({});
            return 'SIGNED OUT';
          })
        }
      />

      <Text style={styles.muted}>
        Compatibility layer (API of react-native-twitter-signin):
      </Text>
      <Button
        id="legacy"
        label="Legacy TwitterSignIn"
        disabled={busy}
        onPress={() =>
          run('LEGACY', async () => {
            setLegacy(null);
            await TwitterSignIn.init(config.clientId, {
              redirectUri: REDIRECT_URI,
              login,
            });
            setLegacy(await TwitterSignIn.logIn());
            return 'LEGACY OK';
          })
        }
      />

      {busy ? <ActivityIndicator /> : null}

      {error ? (
        <Text testID="error" style={styles.bad}>
          {`ERROR ${error.code}: ${error.message}`}
        </Text>
      ) : null}
      {note ? (
        <Text
          testID="note"
          style={note.includes('FAILED') ? styles.bad : styles.ok}
        >
          {note}
        </Text>
      ) : null}

      {result?.profile ? (
        <View testID="result" style={styles.card}>
          <Text style={styles.ok}>SIGNED IN</Text>
          <Text style={styles.mono}>{`id: ${result.profile.id}`}</Text>
          <Text
            style={styles.mono}
          >{`username: @${result.profile.username}`}</Text>
          <Text style={styles.mono}>{`name: ${result.profile.name}`}</Text>
          <Text style={styles.mono}>{`email: ${result.profile.email}`}</Text>
          <Text
            style={styles.mono}
          >{`access token: ${short(tokens.access)}`}</Text>
          <Text
            style={styles.mono}
          >{`refresh token: ${short(tokens.refresh)}`}</Text>
        </View>
      ) : null}

      {legacy ? (
        <View testID="legacy-result" style={styles.card}>
          <Text style={styles.ok}>SIGNED IN (TwitterSignIn)</Text>
          <Text style={styles.mono}>{`userID: ${legacy.userID}`}</Text>
          <Text style={styles.mono}>{`userName: ${legacy.userName}`}</Text>
          <Text style={styles.mono}>{`email: ${legacy.email}`}</Text>
          <Text
            style={styles.mono}
          >{`authToken: ${short(legacy.authToken)}`}</Text>
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
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dimmed: { opacity: 0.5 },
  buttonLabel: { color: '#fff', fontSize: 16, textAlign: 'center' },
  card: { backgroundColor: '#f2f4f7', borderRadius: 8, padding: 12, gap: 4 },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#111',
  },
});
