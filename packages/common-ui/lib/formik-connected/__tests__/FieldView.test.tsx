import { mountWithAppContext } from "common-ui";
import { DinaForm } from "../DinaForm";
import { FieldView } from "../FieldView";
import "@testing-library/jest-dom";

describe("FieldView component", () => {
  it("Renders the label and field value. (minimal use case)", () => {
    // Render the component using the provided RTL wrapper function
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { name: "testName" } }}>
        <FieldView name="testObject.name" />
      </DinaForm>
    );

    const labelElement = wrapper.container.querySelector("label");
    expect(labelElement).not.toBeNull();

    // Use querySelector to find the strong tag inside the container
    const strongElement = wrapper.container.querySelector("strong");
    expect(strongElement).not.toBeNull();
    expect(strongElement?.textContent).toContain("Test Object Name");

    // Verify the field value is rendered correctly
    const fieldValueElement = wrapper.container.querySelector(".field-view");
    expect(fieldValueElement).not.toBeNull(); // Ensure the field value is found
    expect(fieldValueElement?.textContent).toEqual("testName");
  });

  it("Renders with a custom label.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { name: "testName" } }}>
        <FieldView label="Custom Label" name="testObject.name" />
      </DinaForm>
    );
    const labelElement = wrapper.container.querySelector("label");
    expect(labelElement).not.toBeNull();

    // Use querySelector to find the strong tag inside the container
    const strongElement = wrapper.container.querySelector("strong");
    expect(strongElement).not.toBeNull();
    expect(strongElement?.textContent).toContain("Custom Label");
  });

  it("Allows an optional link prop.", () => {
    // Render the component with the context wrapper
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { name: "testName" } }}>
        <FieldView link="/linked-page" name="testObject.name" />
      </DinaForm>
    );

    // Use querySelector to find the anchor tag
    const linkElement = wrapper.container.querySelector("a");
    expect(linkElement).not.toBeNull(); // Ensure the anchor tag is present
    expect(linkElement?.getAttribute("href")).toEqual("/linked-page"); // Check the href attribute
  });

  it("Renders field value as comma seperated string when it is string array object", () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          testObject: { aliases: ["alias1", "alias2"] }
        }}
      >
        <FieldView name="testObject.aliases" />
      </DinaForm>
    );

    // Verify the field value is rendered correctly
    const fieldValueElement = wrapper.container.querySelector(".field-view");
    expect(fieldValueElement).not.toBeNull(); // Ensure the field value is found
    expect(fieldValueElement?.textContent).toEqual("alias1, alias2");
  });
});
