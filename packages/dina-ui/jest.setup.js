// Setup Enzyme
const Enzyme = require("enzyme");
const Adapter = require("enzyme-adapter-react-16");

Enzyme.configure({ adapter: new Adapter() });

// Let tests pretend they are running in the browser:
process.browser = true;

/**
 * Suppress React 16.8 act() warnings globally.
 * The react teams fix won't be out of alpha until 16.9.0.
 */
const consoleError = console.error;
jest.spyOn(console, "error").mockImplementation((...args) => {
  if (
    !args[0].includes(
      "Warning: An update to %s inside a test was not wrapped in act"
    )
  ) {
    consoleError(...args);
  }
});
