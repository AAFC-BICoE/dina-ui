// SSR polyfills:

// The "setimmediate" package from NPM doesn't wait long enough during tests.
// Manually polyfill here:
global.setImmediate = jest.requireActual("timers").setImmediate;

// Let tests pretend they are running in the browser:
process.browser = true;

/**
 * Suppress React 16.8 act() warnings globally.
 * The react teams fix won't be out of alpha until 16.9.0.
 */
const consoleError = console.error;
jest.spyOn(console, "error").mockImplementation((...args) => {
  if (!String(args?.[0])?.includes?.("was not wrapped in act")) {
    consoleError(...args);
  }
});

// Mock scroll method for compatibility in JSDOM test environment
Object.defineProperty(Element.prototype, "scroll", {
  value: jest.fn(),
  writable: true,
  configurable: true
});
Object.defineProperty(Element.prototype, "scrollIntoView", {
  value: jest.fn(),
  writable: true,
  configurable: true
});

jest.setTimeout(50000);

if (!HTMLElement.prototype.scroll) {
  HTMLElement.prototype.scroll = () => {};
}
