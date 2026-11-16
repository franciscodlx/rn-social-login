const {
  setRedirectScheme,
  resolveScheme,
} = require('../../plugin/withAuthCore');

const gradle = `android {
    defaultConfig {
        applicationId "com.example"
        versionName "1.0"
    }
}
`;

describe('Expo config plugin', () => {
  it('adds the redirect scheme placeholder to defaultConfig', () => {
    const out = setRedirectScheme(gradle, 'myapp');
    expect(out).toContain(
      'defaultConfig {\n        manifestPlaceholders["authCoreRedirectScheme"] = "myapp"\n'
    );
    expect(out).toContain('applicationId "com.example"');
  });

  it('is idempotent and updates the scheme on later runs', () => {
    const once = setRedirectScheme(gradle, 'myapp');
    expect(setRedirectScheme(once, 'myapp')).toBe(once);
    const changed = setRedirectScheme(once, 'other');
    expect(changed).toContain('= "other"');
    expect(changed.match(/authCoreRedirectScheme/g)).toHaveLength(1);
  });

  it('rejects invalid schemes and unknown build files', () => {
    expect(() => setRedirectScheme(gradle, 'My App')).toThrow('not a valid');
    expect(() => setRedirectScheme('plugins {}', 'myapp')).toThrow(
      'defaultConfig'
    );
  });

  it('takes the scheme from the plugin props or the app config', () => {
    expect(resolveScheme({ scheme: 'fromconfig' }, { scheme: 'props' })).toBe(
      'props'
    );
    expect(resolveScheme({ scheme: ['a', 'b'] }, undefined)).toBe('a');
    expect(() => resolveScheme({}, undefined)).toThrow('redirect scheme');
  });
});
