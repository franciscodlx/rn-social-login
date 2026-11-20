// Expo config plugin: registers the OAuth redirect scheme on Android.
// iOS needs no native configuration for custom-scheme redirects
// (ASWebAuthenticationSession intercepts them itself).
//
//   plugins: [['@franciscodlxdev/rn-auth-core', { scheme: 'myapp' }]]
const PLACEHOLDER = 'authCoreRedirectScheme';
const LINE = new RegExp(
  `^[ \\t]*manifestPlaceholders\\[["']${PLACEHOLDER}["']\\][ \\t]*=.*\\n`,
  'm'
);

/** Adds (or updates) the redirect scheme placeholder in android/app/build.gradle. */
function setRedirectScheme(buildGradle, scheme) {
  if (!/^[a-z][a-z0-9+.-]*$/.test(scheme)) {
    throw new Error(
      `[rn-auth-core] "${scheme}" is not a valid URI scheme (lowercase letters, digits, "+", "-", ".").`
    );
  }
  const line = `        manifestPlaceholders["${PLACEHOLDER}"] = "${scheme}"\n`;
  if (LINE.test(buildGradle)) {
    return buildGradle.replace(LINE, line);
  }
  const anchor = /defaultConfig\s*\{[ \t]*\n/;
  if (!anchor.test(buildGradle)) {
    throw new Error(
      '[rn-auth-core] Could not find defaultConfig { } in android/app/build.gradle.'
    );
  }
  return buildGradle.replace(anchor, (match) => `${match}${line}`);
}

function resolveScheme(config, props) {
  const fromConfig = Array.isArray(config.scheme)
    ? config.scheme[0]
    : config.scheme;
  const scheme = (props && props.scheme) || fromConfig;
  if (!scheme) {
    throw new Error(
      '[rn-auth-core] Set the redirect scheme: plugins: [["@franciscodlxdev/rn-auth-core", { scheme: "myapp" }]] or "scheme" in your app config.'
    );
  }
  return scheme;
}

function withAuthCore(config, props) {
  // Resolved from the app, so the library does not depend on Expo.
  const { withAppBuildGradle } = require('expo/config-plugins');
  const scheme = resolveScheme(config, props);
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error(
        '[rn-auth-core] Only Groovy android/app/build.gradle files are supported.'
      );
    }
    mod.modResults.contents = setRedirectScheme(
      mod.modResults.contents,
      scheme
    );
    return mod;
  });
}

module.exports = withAuthCore;
module.exports.setRedirectScheme = setRedirectScheme;
module.exports.resolveScheme = resolveScheme;
