# iOS

Usa `ASWebAuthenticationSession`: una hoja del navegador del sistema que comparte sesión con Safari (salvo en modo efímero).

## Redirect con esquema propio

No requiere configuración nativa. `ASWebAuthenticationSession` intercepta `miapp://…` sin registrar el esquema en `Info.plist`.

```ts
signIn({ clientId, redirectUri: 'miapp://callback' });
```

## Redirect con Universal Link (https)

Requiere iOS 17.4 o posterior y el dominio asociado a la app (`applinks:` / `webcredentials:` en Associated Domains y el archivo `apple-app-site-association` en el dominio). En versiones anteriores `signIn` falla con `NOT_SUPPORTED`.

## Aviso "…quiere usar … para iniciar sesión"

Lo muestra iOS cuando la sesión comparte cookies con Safari. Con `prefersEphemeralSession: true` no aparece, pero el usuario no reutiliza la sesión que ya tenga abierta en Safari.

## Problemas comunes

| Síntoma                                      | Causa                                                             |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `NOT_SUPPORTED: … is not linked`             | Falta `pod install` y recompilar, o la app corre en Expo Go       |
| El navegador se cierra y llega `CANCELLED`   | El usuario pulsó "Cancelar"                                       |
| El proveedor muestra "redirect_uri mismatch" | El redirect registrado en el portal no es idéntico al de `signIn` |
