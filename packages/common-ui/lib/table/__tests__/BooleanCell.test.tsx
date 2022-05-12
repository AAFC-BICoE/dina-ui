import { BooleanCell } from "../BooleanCell";
import { mountWithAppContext } from "../../test-util/mock-app-context";

describe("BooleanCell", () => {
  it("Renders the true boolean value", () => {
    const booleanString = "true";
    const cell = BooleanCell("myBooleanField");

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myBooleanField: booleanString }} />
    );

    expect(cell.accessor).toEqual("myBooleanField");
    expect(wrapper.text()).toEqual("True");
  });

  it("Renders the false boolean value", () => {
    const booleanString = "false";
    const cell = BooleanCell("myBooleanField");

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myBooleanField: booleanString }} />
    );

    expect(cell.accessor).toEqual("myBooleanField");
    expect(wrapper.text()).toEqual("False");
  });

  it("Renders an empty string with null value", () => {
    const booleanString = null;
    const cell = BooleanCell("myBooleanField");

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myBooleanField: booleanString }} />
    );

    expect(cell.accessor).toEqual("myBooleanField");
    expect(wrapper.text()).toEqual("");
  });

  it("Renders an empty string with another value other than a boolean", () => {
    const booleanString = "stringTest";
    const cell = BooleanCell("myBooleanField");

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myBooleanField: booleanString }} />
    );

    expect(cell.accessor).toEqual("myBooleanField");
    expect(wrapper.text()).toEqual("");
  });
});
