// SSR Polyfills for browser-only globals
if (typeof window === 'undefined') {
  global.window = {};
  global.document = {
    createElement: () => ({}),
    createTextNode: () => ({}),
    getElementById: () => null,
    getElementsByTagName: () => [],
    getElementsByClassName: () => [],
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  global.navigator = {
    userAgent: '',
    platform: '',
    language: 'en',
  };
  global.location = {
    href: '',
    origin: '',
    protocol: 'https:',
    host: '',
    hostname: '',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
  };
  global.self = global;
  global.top = global;
  global.parent = global;
}

export default {};