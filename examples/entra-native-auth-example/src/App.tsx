import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createEntraNativeAuth,
  isEntraAuthError,
  type EntraStep,
  type EntraTokens,
} from '@franciscodlxdev/react-native-entra-native-auth';
import { config, DEMO, REDIRECT_URI, USE_MOCK } from './config';

function Button(props: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
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

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
}) {
  return (
    <TextInput
      accessibilityLabel={props.label}
      placeholder={props.label}
      value={props.value}
      onChangeText={props.onChangeText}
      secureTextEntry={props.secure}
      autoCapitalize="none"
      autoCorrect={false}
      style={styles.input}
    />
  );
}

export default function App() {
  const auth = useMemo(() => createEntraNativeAuth(config), []);
  const [email, setEmail] = useState(DEMO.email);
  const [password, setPassword] = useState(DEMO.password);
  const [name, setName] = useState('Demo User');
  const [code, setCode] = useState(DEMO.code);
  // The pending step of the flow in progress, if any.
  const [step, setStep] = useState<EntraStep | null>(null);
  const [tokens, setTokens] = useState<EntraTokens | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  /** Runs one call and shows whatever step Entra asks for next. */
  const run = async (label: string, task: () => Promise<EntraStep>) => {
    setBusy(true);
    setMessage('');
    try {
      const next = await task();
      if (next.type === 'signed_in') {
        setTokens(next.tokens);
        setStep(null);
        setMessage(`${label}: SIGNED IN`);
      } else {
        setStep(next);
        setMessage(`${label}: ${next.type.toUpperCase()}`);
      }
    } catch (e) {
      setMessage(
        isEntraAuthError(e)
          ? `${label} FAILED: ${e.reason}`
          : `${label} FAILED: ${String(e)}`
      );
    } finally {
      setBusy(false);
    }
  };

  const start = (label: string, task: () => Promise<EntraStep>) => {
    setTokens(null);
    setStep(null);
    return run(label, task);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Entra native auth example</Text>
      <Text style={styles.muted}>
        {USE_MOCK ? 'Provider: local mock (no tenant)' : 'Provider: Entra'}
      </Text>

      <Field label="Email" value={email} onChangeText={setEmail} />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure
      />
      <Field label="Display name" value={name} onChangeText={setName} />

      <Button
        label="Sign in"
        disabled={busy}
        onPress={() =>
          start('SIGN IN', () => auth.signIn({ username: email, password }))
        }
      />
      <Button
        label="Sign up"
        disabled={busy}
        onPress={() =>
          start('SIGN UP', () =>
            auth.signUp({
              username: email,
              password,
              attributes: { displayName: name },
            })
          )
        }
      />
      <Button
        label="Reset password"
        disabled={busy}
        onPress={() =>
          start('RESET', () => auth.resetPassword({ username: email }))
        }
      />
      {USE_MOCK ? (
        <Button
          label="Use a new demo email"
          disabled={busy}
          onPress={() => setEmail(`demo${Date.now() % 100000}@example.com`)}
        />
      ) : null}

      {step?.type === 'code_required' ? (
        <View style={styles.card}>
          <Text style={styles.muted}>
            {`Code sent to ${step.sentTo ?? 'your email'} (${step.codeLength ?? '?'} digits)`}
          </Text>
          <Field label="Code" value={code} onChangeText={setCode} />
          <Button
            label="Submit code"
            disabled={busy}
            onPress={() => run('CODE', () => auth.submitCode(step, code))}
          />
          <Button
            label="Resend code"
            disabled={busy}
            onPress={() => run('RESEND', () => auth.resendCode(step))}
          />
        </View>
      ) : null}

      {step?.type === 'new_password_required' ? (
        <View style={styles.card}>
          <Text style={styles.muted}>
            The Password field above is used as the new password.
          </Text>
          <Button
            label="Set new password"
            disabled={busy}
            onPress={() =>
              run('NEW PASSWORD', () => auth.submitNewPassword(step, password))
            }
          />
        </View>
      ) : null}

      {step?.type === 'password_required' ? (
        <Button
          label="Submit password"
          disabled={busy}
          onPress={() =>
            run('PASSWORD', () => auth.submitPassword(step, password))
          }
        />
      ) : null}

      {step?.type === 'attributes_required' ? (
        <Button
          label="Submit attributes"
          disabled={busy}
          onPress={() =>
            run('ATTRIBUTES', () =>
              auth.submitAttributes(step, { displayName: name })
            )
          }
        />
      ) : null}

      {step?.type === 'browser_required' ? (
        <Button
          label="Continue in the browser"
          disabled={busy}
          onPress={() =>
            run('BROWSER', async () => ({
              type: 'signed_in',
              tokens: await auth.signInWithBrowser({
                redirectUri: REDIRECT_URI,
                loginHint: step.username,
              }),
            }))
          }
        />
      ) : null}

      {busy ? <ActivityIndicator /> : null}
      {message ? (
        <Text style={message.includes('FAILED') ? styles.bad : styles.ok}>
          {message}
        </Text>
      ) : null}

      {tokens ? (
        <View style={styles.card}>
          <Text style={styles.mono}>{`email: ${tokens.profile?.email}`}</Text>
          <Text style={styles.mono}>{`name: ${tokens.profile?.name}`}</Text>
          <Text style={styles.mono}>
            {`refresh token: ${tokens.refreshToken ? 'yes' : 'no'}`}
          </Text>
          <Button
            label="Refresh token"
            disabled={busy || !tokens.refreshToken}
            onPress={() =>
              run('REFRESH', async () => ({
                type: 'signed_in',
                tokens: await auth.refresh(tokens.refreshToken!),
              }))
            }
          />
          <Button
            label="Sign out"
            disabled={busy}
            onPress={() => {
              // Native auth has no sign-out call: drop the tokens you stored.
              setTokens(null);
              setMessage('SIGNED OUT');
            }}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 64, gap: 10 },
  title: { fontSize: 22, fontWeight: '600', color: '#111' },
  muted: { color: '#57606a' },
  ok: { color: '#0a7d32', fontWeight: '600' },
  bad: { color: '#b00020', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#c9d1d9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111',
  },
  button: {
    backgroundColor: '#0067b8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dimmed: { opacity: 0.5 },
  buttonLabel: { color: '#fff', fontSize: 16, textAlign: 'center' },
  card: { backgroundColor: '#f2f4f7', borderRadius: 8, padding: 12, gap: 8 },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#111',
  },
});
