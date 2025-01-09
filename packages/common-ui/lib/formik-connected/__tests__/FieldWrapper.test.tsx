import { IntlProvider } from "react-intl";
import { mountWithAppContext } from "common-ui";
import { DinaForm, DinaFormSection } from "../DinaForm";
import { FieldWrapper } from "../FieldWrapper";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockSubmit = jest.fn();

describe("FieldWrapper component.", () => {
  beforeEach(jest.clearAllMocks);

  it("Adds a generated title-case label to the wrapped component.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <FieldWrapper name="fieldName">{() => <div />}</FieldWrapper>
      </DinaForm>
    );

    const labelElement = wrapper.container.querySelector("label");
    expect(labelElement).not.toBeNull();
    expect(labelElement?.textContent).toEqual("Field Name");
  });

  it("Accepts a className which is applied to a surrounding div.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <FieldWrapper className="col-6" name="fieldName">
          {() => <div />}
        </FieldWrapper>
      </DinaForm>
    );

    expect(wrapper.container.querySelector(".col-6")).toBeInTheDocument();
  });

  it("Displays the intl message (if there is one) in the label.", () => {
    const wrapper = mountWithAppContext(
      <IntlProvider
        locale="en"
        messages={{ field_testField: "My Field Label" }}
      >
        <DinaForm initialValues={{}}>
          <FieldWrapper name="testField">{() => <div />}</FieldWrapper>
        </DinaForm>
      </IntlProvider>
    );

    const labelElement = wrapper.container.querySelector("label");
    expect(labelElement).not.toBeNull();
    expect(labelElement?.textContent).toEqual("My Field Label");
  });

  it("Displays a custom label.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <FieldWrapper label="The Group's Name" name="group.groupName">
          {() => <div />}
        </FieldWrapper>
      </DinaForm>
    );

    const labelElement = wrapper.container.querySelector("label");
    expect(labelElement).not.toBeNull();
    expect(labelElement?.textContent).toEqual("The Group's Name");
  });

  it("Displays the readOnly value when the form is read-only.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ myField: "my value" }} readOnly={true}>
        <FieldWrapper name="myField" />
      </DinaForm>
    );

    // Verify the field value is rendered correctly
    const fieldValueElement = wrapper.container.querySelector(".field-view");
    expect(fieldValueElement).not.toBeNull(); // Ensure the field value is found
    expect(fieldValueElement?.textContent).toEqual("my value");
  });

  it("Can display a custom read-only view.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ myField: "my value" }} readOnly={true}>
        <FieldWrapper
          name="myField"
          readOnlyRender={(value) => <div className="custom-div">{value}</div>}
        />
      </DinaForm>
    );

    expect(wrapper.container.querySelector(".custom-div")?.textContent).toEqual(
      "my value"
    );
  });

  it("Accepts a custom field name for the template checkbox.", async () => {
    // Render the component with the context wrapper
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ myField: "my value", templateCheckboxes: {} }}
        isTemplate={true}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <DinaFormSection
          componentName="componentName"
          sectionName="sectionName"
        >
          <FieldWrapper
            templateCheckboxFieldName="customTemplateFieldName"
            name="myField"
          >
            {({ value }) => <>{value}</>}
          </FieldWrapper>
        </DinaFormSection>
      </DinaForm>
    );

    // Simulate checking the checkbox
    const checkbox = screen.getByRole("checkbox", {
      name: /select/i
    });
    // Initially, the checkbox should not be checked
    expect(checkbox).not.toBeChecked();

    // Simulate checking the checkbox (toggle to true)
    fireEvent.click(checkbox);

    // Assert that the checkbox is checked
    expect(checkbox).toBeChecked();

    // Simulate form submission
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for the form submission to complete
    await waitFor(() => expect(mockSubmit).toHaveBeenCalled());

    // Verify the submitted values
    expect(mockSubmit).toHaveBeenCalledWith({
      myField: "my value",
      templateCheckboxes: {
        "componentName.sectionName.customTemplateFieldName": true
      }
    });
  });

  it("Properly hides the field when the form template has disabled it.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ myField1: "my value", templateCheckboxes: {} }}
        formTemplate={{
          type: "form-template",
          components: [
            {
              name: "testComponent",
              visible: true,
              order: 0,
              sections: [
                {
                  name: "enabledSection",
                  visible: true,
                  items: [
                    {
                      name: "enabledField1",
                      visible: true
                    },
                    {
                      name: "customTemplateFieldName",
                      visible: true
                    }
                  ]
                },
                {
                  name: "disabledSection",
                  visible: true,
                  items: [
                    {
                      name: "disabledField1",
                      visible: false
                    },
                    {
                      name: "disabledCustomTemplateFieldName",
                      visible: false
                    }
                  ]
                }
              ]
            }
          ]
        }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <DinaFormSection componentName="testComponent">
          <DinaFormSection sectionName="enabledSection">
            {/* Enabled Fields: */}
            <FieldWrapper name="enabledField1">
              {() => <div className="enabledField1" />}
            </FieldWrapper>
            <FieldWrapper
              templateCheckboxFieldName="customTemplateFieldName"
              name="enabledField2"
            >
              {() => <div className="enabledField2" />}
            </FieldWrapper>
          </DinaFormSection>

          <DinaFormSection sectionName="disabledSection">
            {/* Disabled Fields: */}
            <FieldWrapper name="disabledField1">
              {() => <div className="disabledField1" />}
            </FieldWrapper>
            <FieldWrapper
              templateCheckboxFieldName="disabledCustomTemplateFieldName"
              name="disabledField2"
            >
              {() => <div className="disabledField2" />}
            </FieldWrapper>
          </DinaFormSection>
        </DinaFormSection>
      </DinaForm>
    );

    expect(wrapper.container.querySelector(".enabledField1")).not.toBeNull();
    expect(wrapper.container.querySelector(".enabledField2")).not.toBeNull();
    expect(wrapper.container.querySelector(".disabledField1")).toBeNull();
    expect(wrapper.container.querySelector(".disabledField2")).toBeNull();
  });
});
