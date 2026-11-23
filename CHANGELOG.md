# Changelog

Cada paquete lleva su propio historial en `packages/*/CHANGELOG.md`; este archivo resume las versiones de la familia. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y las versiones, [SemVer](https://semver.org/lang/es/).

## [0.1.0] - 2026-11-20

Primera versión pública de los 9 paquetes para React Native.

### Agregado

- Núcleo con OAuth 2.0 authorization code + PKCE (S256), `state` y `nonce`, en el navegador del sistema: `ASWebAuthenticationSession` en iOS y Custom Tabs en Android. Sin WebView y sin `client_secret` en la app.
- Errores normalizados: `CANCELLED`, `NETWORK`, `INVALID_CONFIG`, `PROVIDER_ERROR` y `NOT_SUPPORTED`.
- Proveedores: LinkedIn, X, Mercado Libre, Twitch, GitHub, Discord, Slack, Strava, Telegram y TikTok, más Entra External ID (native authentication).
- App demo, proveedor OAuth local (`mock-idp`) y backends de ejemplo para probar sin credenciales.

[0.1.0]: https://github.com/franciscodlx/rn-social-login/releases/tag/v0.1.0
