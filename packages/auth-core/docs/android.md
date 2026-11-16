# Android

Usa Custom Tabs (Chrome u otro navegador compatible). Si no hay proveedor de Custom Tabs, abre el navegador por defecto.

## Esquema del redirect

La librería declara la actividad que recibe el redirect; tú solo indicas el esquema en `android/app/build.gradle`:

```groovy
android {
    defaultConfig {
        manifestPlaceholders["authCoreRedirectScheme"] = "miapp"
    }
}
```

Sin ese valor la compilación falla con `Manifest merger failed: … authCoreRedirectScheme`.

## Redirect con App Link (https)

Agrega un `intent-filter` a la actividad de la librería desde el manifest de tu app:

```xml
<activity
    android:name="com.franciscodlx.rnauthcore.AuthRedirectActivity"
    android:exported="true"
    tools:node="merge">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="miapp.com" android:path="/callback" />
    </intent-filter>
</activity>
```

Recuerda publicar `assetlinks.json` en el dominio.

## Cómo funciona

1. `AuthSessionActivity` (invisible) abre el Custom Tab.
2. El proveedor redirige a `miapp://callback`; `AuthRedirectActivity` lo recibe y solo lo acepta si coincide con el redirect del login en curso.
3. `AuthSessionActivity` vuelve al frente, cierra el tab y entrega la URL a JavaScript.

Si el usuario cierra el tab, `signIn` falla con `CANCELLED`.

## Sesión efímera

`prefersEphemeralSession: true` usa un Custom Tab efímero cuando el navegador lo soporta; si no, abre un tab normal.
