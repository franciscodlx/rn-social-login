# Contribuir

## Preparar el entorno

```sh
pnpm install
```

El workspace usa `nodeLinker: hoisted` (ver `pnpm-workspace.yaml`): Gradle, CocoaPods y Metro esperan un `node_modules` plano en la raíz.

## Correr el ejemplo

1. Proveedor local: `pnpm --filter @franciscodlxdev/mock-idp start`. Con `MOCK_IDP_AUTO=approve` redirige sin mostrar la pantalla de consentimiento; con `MOCK_IDP_AUTO=deny` siempre rechaza.
2. Metro: `pnpm --filter @franciscodlxdev/rn-auth-core-example start`.
3. App: `pnpm --filter @franciscodlxdev/rn-auth-core-example ios` o `android`.

En el emulador de Android el ejemplo llega al proveedor local por `10.0.2.2`; en el simulador de iOS, por `localhost`.

Para LinkedIn el ejemplo necesita además el backend: `pnpm --filter @franciscodlxdev/linkedin-backend-example start` y la app `@franciscodlxdev/react-native-linkedin-login-example`. Mercado Libre funciona igual con `@franciscodlxdev/mercadolibre-backend-example` (puerto 4200) y `@franciscodlxdev/react-native-mercadolibre-login-example`. Twitch usa `@franciscodlxdev/twitch-backend-example` (puerto 4300) y `@franciscodlxdev/react-native-twitch-login-example`. Los presets usan `@franciscodlxdev/presets-backend-example` (puerto 4400) y `@franciscodlxdev/rn-oauth-presets-example`. Telegram usa `@franciscodlxdev/telegram-backend-example` (puerto 4500) y `@franciscodlxdev/react-native-telegram-login-example`. TikTok usa `@franciscodlxdev/tiktok-backend-example` (puerto 4600) y `@franciscodlxdev/react-native-tiktok-login-example`. Entra usa `@franciscodlxdev/mock-entra` (puerto 4700, código de un solo uso `12345678`) y `@franciscodlxdev/react-native-entra-native-auth-example`, sin backend. X solo necesita el proveedor local y `@franciscodlxdev/react-native-x-login-example`.

## Qué probar en dispositivo antes de abrir un PR

| Caso                                        | Resultado esperado                                   |
| ------------------------------------------- | ---------------------------------------------------- |
| "Sign in (code for your backend)" y aprobar | `SIGNED IN (code)` con `code` y `codeVerifier`       |
| "Sign in + exchange on device"              | `SIGNED IN (exchange)` con `accessToken` y `profile` |
| Cerrar el navegador sin aprobar             | `ERROR CANCELLED: The user closed the browser`       |
| Pulsar "Deny"                               | `ERROR CANCELLED: The user denied the request`       |

## Antes de enviar

```sh
pnpm lint && pnpm typecheck && pnpm test
pnpm changeset   # describe el cambio; genera la entrada del CHANGELOG
```

- Commits con [Conventional Commits](https://www.conventionalcommits.org/): `feat(auth-core): …`, `fix(linkedin): …`.
- Código y comentarios en inglés; documentación en español.
- Un cambio de comportamiento lleva su prueba.

## Agregar un proveedor

1. Crea `packages/<proveedor>-login` con `createProviderLogin({ … })` del núcleo: endpoints, scopes por defecto y `mapProfile`.
2. Crea su app de ejemplo con `scripts/new-example.sh` (clona `examples/auth-core-example` con otro nombre, id y esquema).
3. Copia la plantilla de README de `packages/auth-core` y completa la sección "Configurar el proveedor".
4. Si es un fork, conserva la licencia y el copyright originales y menciona el repo de origen.

## Publicar

`pnpm version-packages` aplica los changesets y `pnpm release` compila y publica en npm (requiere sesión con acceso al scope `@franciscodlxdev`).
