# rn-social-login

Plugins de login social para React Native con un núcleo compartido: OAuth 2.0 + PKCE en el navegador del sistema, sin `clientSecret` en la app y con la misma API en todos los proveedores.

```ts
const { code, codeVerifier } = await signIn({ clientId, redirectUri });
```

## Paquetes

| Paquete                                            | Qué hace                                                           | Estado                   |
| -------------------------------------------------- | ------------------------------------------------------------------ | ------------------------ |
| [`@franciscodlx/rn-auth-core`](packages/auth-core) | PKCE, `state`/`nonce`, navegador del sistema, errores normalizados | Probado en iOS y Android |
| `@franciscodlx/react-native-linkedin-login`        | LinkedIn con OpenID Connect                                        | Siguiente                |
| `@franciscodlx/react-native-x-login`               | X con OAuth 2.0 + PKCE                                             | Pendiente                |
| `@franciscodlx/react-native-mercadolibre-login`    | Mercado Libre con selector de país                                 | Pendiente                |
| `@franciscodlx/react-native-twitch-login`          | Twitch con OIDC                                                    | Pendiente                |

Cada proveedor es un paquete independiente (versión, changelog y publicación propios) que solo aporta endpoints, scopes y mapeo de perfil; el flujo y la seguridad viven en el núcleo.

## Estructura

```
packages/auth-core            núcleo (TurboModule: Swift + Kotlin)
packages/linkedin-login       LinkedIn (JS sobre el núcleo)
examples/auth-core-example    app para probar el núcleo en iOS y Android
examples/linkedin-login-example  app para probar LinkedIn
packages/x-login              X / Twitter (JS sobre el núcleo)
examples/x-login-example     app para probar X
examples/linkedin-backend     backend de ejemplo: redirect https y canje con el secret
examples/mock-idp             proveedor OAuth/OIDC local, sin credenciales reales
scripts/new-example.sh        crea la app de ejemplo de un plugin nuevo
```

## Desarrollo

Requiere Node 22, pnpm 12, Xcode y Android SDK.

```sh
pnpm install
pnpm test          # pruebas unitarias
pnpm typecheck
pnpm lint
pnpm build         # compila los paquetes con bob
```

Probar el flujo completo, sin cuenta en ningún proveedor:

```sh
pnpm --filter @franciscodlx/mock-idp start            # proveedor local en :4000
pnpm --filter @franciscodlx/rn-auth-core-example start # Metro
pnpm --filter @franciscodlx/rn-auth-core-example ios   # o android
```

Más detalle en [CONTRIBUTING.md](CONTRIBUTING.md). Vulnerabilidades: [SECURITY.md](SECURITY.md).

## Licencia

MIT
