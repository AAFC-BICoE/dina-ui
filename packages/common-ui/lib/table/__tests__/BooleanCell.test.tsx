import { booleanCell } from "../booleanCell";
import { mountWithAppContext } from "../../test-util/mock-app-context";

describe("booleanCell", () => {
  it("Renders the true boolean value", () => {
    const booleanString = "true";
    const cell = booleanCell("myBooleanField");

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myBooleanField: booleanString }} />
    );

    expect(cell.accessor).toEqual("myBooleanField");
    expect(wrapper.debug()).toMatchSnapshot();
  });

  it("Renders the false boolean value", () => {
    const booleanString = "false";
    const cell = booleanCell("myBooleanField");

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myBooleanField: booleanString }} />
    );

    expect(cell.accessor).toEqual("myBooleanField");
    expect(wrapper.debug()).toMatchSnapshot();
  });

  it("Renders an empty string with null value", () => {
    const booleanString = null;
    const cell = booleanCell("myBooleanField");

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myBooleanField: booleanString }} />
    );

    expect(cell.accessor).toEqual("myBooleanField");
    expect(wrapper.debug()).toMatchSnapshot();
  });

  it("Renders an empty string with another value other than a boolean", () => {
    const booleanString = "stringTest";
    const cell = booleanCell("myBooleanField");

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myBooleanField: booleanString }} />
    );

    expect(cell.accessor).toEqual("myBooleanField");
    expect(wrapper.debug()).toMatchSnapshot();
  });
});
