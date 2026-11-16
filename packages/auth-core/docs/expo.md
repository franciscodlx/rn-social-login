# Expo

La librería tiene código nativo: funciona en development builds y en builds de EAS, no en Expo Go (`isAvailable()` devuelve `false` y `signIn` falla con `NOT_SUPPORTED`).

```sh
npx expo install @franciscodlx/rn-auth-core
```

`app.json`:

```json
{
  "expo": {
    "scheme": "miapp",
    "plugins": [["@franciscodlx/rn-auth-core", { "scheme": "miapp" }]]
  }
}
```

Si omites `scheme` en el plugin, se usa el `scheme` de la app. Después:

```sh
npx expo prebuild
npx expo run:ios   # o run:android
```

El plugin agrega `manifestPlaceholders["authCoreRedirectScheme"]` a `android/app/build.gradle`. iOS no necesita cambios.
