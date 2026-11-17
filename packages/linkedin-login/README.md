# @franciscodlx/react-native-linkedin-login

Login con LinkedIn para React Native (iOS, Android, Expo) con OpenID Connect, en el navegador del sistema. Sin WebView y sin `clientSecret` en la app.

## Compatibilidad

| Paquete | React Native   | Expo SDK                       | iOS    | Android        | New Architecture |
| ------- | -------------- | ------------------------------ | ------ | -------------- | ---------------- |
| 0.1.x   | 0.88 (probado) | development build (no Expo Go) | ≥ 15.1 | ≥ 7.0 (API 24) | Requerida        |

## Instalación

```sh
npm i @franciscodlx/react-native-linkedin-login @franciscodlx/rn-auth-core
cd ios && pod install
```

El núcleo se instala aparte para que React Native enlace su módulo nativo. Android necesita el esquema de tu app en `android/app/build.gradle`:

```groovy
manifestPlaceholders["authCoreRedirectScheme"] = "miapp"
```

Expo: `plugins: [["@franciscodlx/rn-auth-core", { "scheme": "miapp" }]]`.

## Configurar el proveedor

1. Crea la app en [LinkedIn Developers](https://www.linkedin.com/developers/apps) y agrega el producto **Sign In with LinkedIn using OpenID Connect**.
2. En Auth → Authorized redirect URLs registra una URL **https de tu backend**, por ejemplo `https://api.miapp.com/auth/linkedin/callback`. LinkedIn no acepta esquemas propios (`miapp://`).
3. Scopes: `openid profile email` (los que usa el paquete por defecto).

LinkedIn exige el `client_secret` para cambiar el código por tokens, así que necesitas un backend con dos rutas: una que reenvíe el redirect a tu app y otra que haga el canje. [`examples/linkedin-backend`](../../examples/linkedin-backend) es una implementación completa.

```
app ──signIn()──▶ LinkedIn ──https──▶ tu backend /callback ──miapp://callback──▶ app
app ──code──▶ tu backend /exchange ──code + secret──▶ LinkedIn ──▶ perfil
```

## Uso

```tsx
import { useLinkedInLogin } from '@franciscodlx/react-native-linkedin-login';

function LinkedInButton() {
  const { signIn, loading, error } = useLinkedInLogin({
    clientId: 'TU_CLIENT_ID',
    redirectUri: 'https://api.miapp.com/auth/linkedin/callback',
    callbackUri: 'miapp://callback',
  });

  const onPress = async () => {
    const result = await signIn();
    if (!result) return; // ver `error` (CANCELLED si el usuario cerró)
    await fetch('https://api.miapp.com/auth/linkedin/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: result.code,
        redirectUri: result.redirectUri,
      }),
    });
  };

  return (
    <Button title="Entrar con LinkedIn" disabled={loading} onPress={onPress} />
  );
}
```

Sin hook: `const { code, redirectUri } = await linkedInLogin.signIn({ clientId, redirectUri, callbackUri })`.

| Exporta                                                                                         | Para qué                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `useLinkedInLogin(options)`                                                                     | Hook: `{ signIn, signOut, loading, result, error, isAvailable }`                                                 |
| `linkedInLogin`                                                                                 | `signIn`, `signOut`, `isAvailable` sin React                                                                     |
| `createLinkedInLogin(overrides)`                                                                | Otra instancia: parámetros extra (`extraAuthParams: { enable_extended_login: 'true' }`) o un servidor de pruebas |
| `mapLinkedInProfile(userinfo)`                                                                  | Convierte la respuesta de `/v2/userinfo` en `LinkedInProfile`                                                    |
| `LINKEDIN_TOKEN_ENDPOINT`, `LINKEDIN_USERINFO_ENDPOINT`, `LINKEDIN_JWKS_URI`, `LINKEDIN_ISSUER` | Constantes para tu backend                                                                                       |
| `LinkedInModal`                                                                                 | Capa de compatibilidad (obsoleta), ver "Migrar"                                                                  |

## Backend (canje del código)

Node, completo y con pruebas: [`examples/linkedin-backend/server.mjs`](../../examples/linkedin-backend/server.mjs). Laravel:

```php
// Reenvía el redirect de LinkedIn a la app.
Route::get('/auth/linkedin/callback', fn (Request $r) =>
    redirect()->away('miapp://callback?' . $r->getQueryString()));

Route::post('/auth/linkedin/exchange', function (Request $r) {
    $tokens = Http::asForm()->post('https://www.linkedin.com/oauth/v2/accessToken', [
        'grant_type' => 'authorization_code',
        'code' => $r->input('code'),
        'redirect_uri' => config('services.linkedin.redirect'), // fijo, no el que mande la app
        'client_id' => config('services.linkedin.client_id'),
        'client_secret' => config('services.linkedin.client_secret'),
    ])->throw()->json();

    $profile = Http::withToken($tokens['access_token'])
        ->get('https://api.linkedin.com/v2/userinfo')->throw()->json();

    // Crea aquí tu propia sesión para $profile['sub'].
    return ['profile' => $profile];
});
```

## Errores normalizados

`CANCELLED | NETWORK | INVALID_CONFIG | PROVIDER_ERROR | NOT_SUPPORTED`, en `error.code`. `user_cancelled_login` y `user_cancelled_authorize` de LinkedIn llegan como `CANCELLED`; el código original queda en `error.providerError`.

## Seguridad

- El `client_secret` vive solo en tu backend; la app nunca recibe un token de LinkedIn.
- `state` se genera y verifica en el dispositivo.
- LinkedIn no documenta PKCE ni `nonce` para este flujo, así que no se envían. El flujo "native PKCE" de LinkedIn solo admite redirect a `127.0.0.1` y requiere habilitación por parte de LinkedIn, por lo que no aplica a apps móviles.
- Verifica la firma del `id_token` en el backend con `LINKEDIN_JWKS_URI` (el ejemplo lo hace).
- En tu backend, el destino del reenvío y el `redirect_uri` del canje deben ser fijos, no tomados de la petición.

## Migrar desde @gcou/react-native-linkedin

`LinkedInModal` sigue existiendo con las mismas props y el mismo `ref`, pero abre el navegador del sistema. Avisa en consola que está obsoleto.

| Antes                                                                            | Ahora                                                                       |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `<LinkedInModal clientID redirectUri onSuccess />`                               | Igual; agrega `callbackUri="miapp://callback"`                              |
| `onSuccess({ authentication_code })`                                             | Igual                                                                       |
| `shouldGetAccessToken`, `clientSecret`                                           | Sin soporte: siempre llega `authentication_code`; el canje va en tu backend |
| `onSuccess({ access_token, expires_in })`                                        | Lo devuelve tu backend                                                      |
| `permissions` por defecto `r_liteprofile`, `r_emailaddress`                      | `openid`, `profile`, `email` (los anteriores fueron retirados por LinkedIn) |
| `onError({ type, message })`                                                     | Igual; una cancelación ya no llama a `onError`                              |
| `ref.open()`, `ref.close()`                                                      | Igual                                                                       |
| `ref.logoutAsync()`                                                              | No hace nada: la sesión es del navegador del sistema                        |
| `authState`                                                                      | Ignorada: el `state` lo genera la librería                                  |
| `renderClose`, `containerStyle`, `wrapperStyle`, `closeStyle`, `animationType`   | Ignoradas: ya no hay modal                                                  |
| `react-native-webview`, `react-native-get-random-values`, `uuid`, `query-string` | Ya no se necesitan                                                          |

## Probar sin credenciales

`examples/linkedin-login-example` corre contra `examples/mock-idp` y `examples/linkedin-backend`. Ver [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licencia y créditos

MIT. Reescritura de [GaelCO/react-native-linkedin](https://github.com/GaelCO/react-native-linkedin), a su vez fork de `xcarpentier/react-native-linkedin` (© 2017 Xavier Carpentier), cuyo copyright se conserva en `LICENSE`.
