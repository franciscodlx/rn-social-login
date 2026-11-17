# Contribuir

## Preparar el entorno

```sh
pnpm install
```

El workspace usa `nodeLinker: hoisted` (ver `pnpm-workspace.yaml`): Gradle, CocoaPods y Metro esperan un `node_modules` plano en la raíz.

## Correr el ejemplo

1. Proveedor local: `pnpm --filter @franciscodlx/mock-idp start`. Con `MOCK_IDP_AUTO=approve` redirige sin mostrar la pantalla de consentimiento; con `MOCK_IDP_AUTO=deny` siempre rechaza.
2. Metro: `pnpm --filter @franciscodlx/rn-auth-core-example start`.
3. App: `pnpm --filter @franciscodlx/rn-auth-core-example ios` o `android`.

En el emulador de Android el ejemplo llega al proveedor local por `10.0.2.2`; en el simulador de iOS, por `localhost`.

Para LinkedIn el ejemplo necesita además el backend: `pnpm --filter @franciscodlx/linkedin-backend-example start` y la app `@franciscodlx/react-native-linkedin-login-example`. Mercado Libre funciona igual con `@franciscodlx/mercadolibre-backend-example` (puerto 4200) y `@franciscodlx/react-native-mercadolibre-login-example`. X solo necesita el proveedor local y `@franciscodlx/react-native-x-login-example`.

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

`pnpm version-packages` aplica los changesets y `pnpm release` compila y publica en npm (requiere sesión con acceso al scope `@franciscodlx`).
