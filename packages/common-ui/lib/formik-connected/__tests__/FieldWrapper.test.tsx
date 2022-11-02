import { IntlProvider } from "react-intl";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm, DinaFormSection } from "../DinaForm";
import { FieldWrapper } from "../FieldWrapper";

const mockSubmit = jest.fn();

describe("FieldWrapper component.", () => {
  beforeEach(jest.clearAllMocks);

  it("Adds a generated title-case label to the wrapped component.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <FieldWrapper name="fieldName">{() => <div />}</FieldWrapper>
      </DinaForm>
    );

    expect(wrapper.find("label").text()).toEqual("Field Name");
  });

  it("Accepts a className which is applied to a surrounding div.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <FieldWrapper className="col-6" name="fieldName">
          {() => <div />}
        </FieldWrapper>
      </DinaForm>
    );

    expect(wrapper.find(".col-6").exists()).toEqual(true);
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

    expect(wrapper.find("label").text()).toEqual("My Field Label");
  });

  it("Displays a custom label.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <FieldWrapper label="The Group's Name" name="group.groupName">
          {() => <div />}
        </FieldWrapper>
      </DinaForm>
    );

    expect(wrapper.find("label").text()).toEqual("The Group's Name");
  });

  it("Displays the readOnly value when the form is read-only.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ myField: "my value" }} readOnly={true}>
        <FieldWrapper name="myField" />
      </DinaForm>
    );

    expect(wrapper.find(".field-view").text()).toEqual("my value");
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

    expect(wrapper.find(".custom-div").text()).toEqual("my value");
  });

  it("Accepts a custom field name for the template checkbox.", async () => {
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

    wrapper
      .find("input[type='checkbox']")
      .simulate("change", { target: { checked: true } });
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSubmit).lastCalledWith({
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

    expect(wrapper.find(".enabledField1").exists()).toEqual(true);
    expect(wrapper.find(".enabledField2").exists()).toEqual(true);
    expect(wrapper.find(".disabledField1").exists()).toEqual(false);
    expect(wrapper.find(".disabledField2").exists()).toEqual(false);
  });
});
