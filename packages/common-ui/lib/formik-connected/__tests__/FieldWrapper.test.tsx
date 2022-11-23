import { FormTemplate } from "../../../../dina-ui/types/collection-api";
import { IntlProvider } from "react-intl";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm, DinaFormSection } from "../DinaForm";
import { FieldWrapper } from "../FieldWrapper";
import { BulkEditContext, BulkEditTabContext } from "../..";

const mockSubmit = jest.fn();

describe("FieldWrapper component.", () => {
  beforeEach(jest.clearAllMocks);

  describe("Field wrapper display props", () => {
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

      // Snapshot ensures the structure does not change.
      expect(wrapper.find(FieldWrapper).html()).toMatchSnapshot();
    });

    it("Displays horizontal custom label.", () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{}} horizontal={true}>
          <FieldWrapper label="The Group's Name" name="group.groupName">
            {() => <div />}
          </FieldWrapper>
        </DinaForm>
      );

      // Snapshot ensures the structure does not change.
      expect(wrapper.find(FieldWrapper).html()).toMatchSnapshot();
    });
  });

  describe("Read only views", () => {
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
            readOnlyRender={(value) => (
              <div className="custom-div">{value}</div>
            )}
          />
        </DinaForm>
      );

      expect(wrapper.find(".custom-div").text()).toEqual("my value");
    });
  });

  describe("Form Template functionality", () => {
    const FORM_TEMPLATE_DEFAULT_VALUES: FormTemplate = {
      type: "form-template",
      components: [
        {
          name: "testComponent",
          visible: true,
          order: 0,
          sections: [
            {
              name: "testSection1",
              visible: true,
              items: [
                {
                  name: "testField1",
                  visible: true,
                  defaultValue: 1
                },
                {
                  name: "testField2",
                  visible: true,
                  defaultValue: true
                }
              ]
            },
            {
              name: "testSection2",
              visible: true,
              items: [
                {
                  name: "testField3",
                  visible: true,
                  defaultValue: "defaultValue1"
                },
                {
                  name: "testField4",
                  visible: true,
                  defaultValue: "defaultValue2"
                }
              ]
            }
          ]
        }
      ]
    };

    const DINA_FORM_DEFAULT_VALUES = (disableSection) => (
      <DinaFormSection componentName="testComponent">
        <DinaFormSection sectionName="testSection1">
          <FieldWrapper name="testField1">
            {(props) => <div className="testField1">{props.value}</div>}
          </FieldWrapper>
          <FieldWrapper name="testField2">
            {(props) => (
              <div className="testField2">{props.value ? "true" : "false"}</div>
            )}
          </FieldWrapper>
        </DinaFormSection>

        <DinaFormSection sectionName="testSection2">
          <FieldWrapper
            name="testField3"
            disableFormTemplateDefaultValue={disableSection}
          >
            {(props) => <div className="testField3">{props.value}</div>}
          </FieldWrapper>
          <FieldWrapper
            name="testField4"
            disableFormTemplateDefaultValue={disableSection}
          >
            {(props) => <div className="testField4">{props.value}</div>}
          </FieldWrapper>
        </DinaFormSection>
      </DinaFormSection>
    );

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

    it("Default values are provided from the form template", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm
          // These values should be overridden.
          initialValues={{
            testField1: 2,
            testField2: false,
            testField3: "initialValue1",
            testField4: "initialValue2"
          }}
          formTemplate={FORM_TEMPLATE_DEFAULT_VALUES}
          onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
          isExistingRecord={false}
        >
          {DINA_FORM_DEFAULT_VALUES(false)}
        </DinaForm>
      );

      // Expect the form template default values. NOT the form initial values.
      expect(wrapper.find(".testField1").text()).toEqual("1");
      expect(wrapper.find(".testField2").text()).toEqual("true");
      expect(wrapper.find(".testField3").text()).toEqual("defaultValue1");
      expect(wrapper.find(".testField4").text()).toEqual("defaultValue2");

      // Changing the form template to undefined should re-render the form with the forms initial values.
      wrapper.setProps({
        children: (
          <DinaForm
            // These values should be overridden.
            initialValues={{
              testField1: 2,
              testField2: false,
              testField3: "initialValue1",
              testField4: "initialValue2"
            }}
            formTemplate={undefined}
            onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
            isExistingRecord={false}
          >
            {DINA_FORM_DEFAULT_VALUES(false)}
          </DinaForm>
        )
      });
      wrapper.update();

      // Now it should be the forms initial values.
      expect(wrapper.prop("formTemplate")).toBeUndefined();
      expect(wrapper.find(".testField1").text()).toEqual("2");
      expect(wrapper.find(".testField2").text()).toEqual("false");
      expect(wrapper.find(".testField3").text()).toEqual("initialValue1");
      expect(wrapper.find(".testField4").text()).toEqual("initialValue2");
    });

    it("Form template default values should only work for creating new records", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm
          // These values should be overridden.
          initialValues={{
            testField1: 2,
            testField2: false,
            testField3: "initialValue1",
            testField4: "initialValue2"
          }}
          formTemplate={FORM_TEMPLATE_DEFAULT_VALUES}
          onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
          isExistingRecord={true} // Editing an existing record.
        >
          {DINA_FORM_DEFAULT_VALUES(false)}
        </DinaForm>
      );

      // The initial values should be used in this case since it's a existing record.
      expect(wrapper.find(".testField1").text()).toEqual("2");
      expect(wrapper.find(".testField2").text()).toEqual("false");
      expect(wrapper.find(".testField3").text()).toEqual("initialValue1");
      expect(wrapper.find(".testField4").text()).toEqual("initialValue2");
    });

    it("Custom default value handling support for fields", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm
          // These values should be overridden.
          initialValues={{
            testField2: false
          }}
          formTemplate={FORM_TEMPLATE_DEFAULT_VALUES}
          onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
          isExistingRecord={false}
        >
          <DinaFormSection componentName="testComponent">
            <DinaFormSection sectionName="testSection1">
              <FieldWrapper
                name="testField2"
                customHandleDefaultValue={({
                  formikContext,
                  formTemplate,
                  formTemplateItem,
                  setDefaultValue,
                  initialValues
                }) => {
                  if (formTemplateItem?.defaultValue === true) {
                    setDefaultValue("custom true value");
                  } else {
                    setDefaultValue("custom false value");
                  }

                  // Test using the formik context to update other fields.
                  formikContext.setFieldValue(
                    "testField3",
                    JSON.stringify(formTemplate)
                  );
                  formikContext.setFieldValue(
                    "testField4",
                    JSON.stringify(initialValues)
                  );
                }}
              >
                {(props) => <div className="testField2">{props.value}</div>}
              </FieldWrapper>
              <FieldWrapper
                name="testField3"
                disableFormTemplateDefaultValue={true}
              >
                {(props) => <div className="testField3">{props.value}</div>}
              </FieldWrapper>
              <FieldWrapper
                name="testField4"
                disableFormTemplateDefaultValue={true}
              >
                {(props) => <div className="testField4">{props.value}</div>}
              </FieldWrapper>
            </DinaFormSection>
          </DinaFormSection>
        </DinaForm>
      );

      // Check to see if the custom value is returned.
      expect(wrapper.find(".testField2").text()).toEqual("custom true value");

      // This snapshot contains the form template, to ensure it's being returned.
      expect(wrapper.find(".testField3").html()).toMatchSnapshot();

      // This snapshot contains the initial values, to ensur eit's being returned.
      expect(wrapper.find(".testField4").html()).toMatchSnapshot();
    });

    it("Disable the default values being used from the form template", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm
          // These values should be overridden.
          initialValues={{
            testField1: 2,
            testField2: false,
            testField3: "initialValue1",
            testField4: "initialValue2"
          }}
          formTemplate={FORM_TEMPLATE_DEFAULT_VALUES}
          onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
          isExistingRecord={false}
        >
          {DINA_FORM_DEFAULT_VALUES(true)}
        </DinaForm>
      );

      // Expect for field 1 and 2 to be using form template, other fields are disabled.
      expect(wrapper.find(".testField1").text()).toEqual("1");
      expect(wrapper.find(".testField2").text()).toEqual("true");
      expect(wrapper.find(".testField3").text()).toEqual("initialValue1"); // Disabled, use initial.
      expect(wrapper.find(".testField4").text()).toEqual("initialValue2"); // Disabled, use initial.
    });

    it("Bulk editing using form template default values (Edit All Tab)", async () => {
      // Default values should work when editing in the EDIT ALL tab.
      const wrapper = mountWithAppContext(
        <BulkEditContext.Provider value={true}>
          <BulkEditTabContext.Provider
            value={{ bulkEditFormRef: jest.fn as any, resourceHooks: [] }}
          >
            <DinaForm
              // These values should be overridden.
              initialValues={{
                testField1: 2,
                testField2: false,
                testField3: "initialValue1",
                testField4: "initialValue2"
              }}
              formTemplate={FORM_TEMPLATE_DEFAULT_VALUES}
              onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
              isExistingRecord={false}
            >
              {DINA_FORM_DEFAULT_VALUES(false)}
            </DinaForm>
          </BulkEditTabContext.Provider>
        </BulkEditContext.Provider>
      );

      // Expect the form template default values. NOT the form initial values.
      expect(wrapper.find(".testField1").text()).toEqual("1");
      expect(wrapper.find(".testField2").text()).toEqual("true");
      expect(wrapper.find(".testField3").text()).toEqual("defaultValue1");
      expect(wrapper.find(".testField4").text()).toEqual("defaultValue2");
    });

    it("Bulk editing using form template default values (Individual Edit Tab)", async () => {
      // Try it again but this time as a individual tab.
      const wrapper = mountWithAppContext(
        <BulkEditContext.Provider value={true}>
          <DinaForm
            // These values should be overridden.
            initialValues={{
              testField1: 2,
              testField2: false,
              testField3: "initialValue1",
              testField4: "initialValue2"
            }}
            formTemplate={FORM_TEMPLATE_DEFAULT_VALUES}
            onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
            isExistingRecord={false}
          >
            {DINA_FORM_DEFAULT_VALUES(false)}
          </DinaForm>
        </BulkEditContext.Provider>
      );

      // Expect the initial values.
      expect(wrapper.find(".testField1").text()).toEqual("2");
      expect(wrapper.find(".testField2").text()).toEqual("false");
      expect(wrapper.find(".testField3").text()).toEqual("initialValue1");
      expect(wrapper.find(".testField4").text()).toEqual("initialValue2");
    });
  });
});
