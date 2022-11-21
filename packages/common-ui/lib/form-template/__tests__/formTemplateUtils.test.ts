import { FormTemplate } from "../../../../dina-ui/types/collection-api";
import {
  getFormTemplateComponent,
  getFormTemplateField,
  getFormTemplateSection
} from "../formTemplateUtils";

const COMPONENT_NAME = "component1";
const SECTION_NAME = "section1";
const FIELD_NAME = "field1";

const FORM_TEMPLATE_TEST: FormTemplate = {
  type: "form-template",
  components: [
    {
      name: COMPONENT_NAME,
      visible: true,
      order: 0,
      sections: [
        {
          name: SECTION_NAME,
          gridPositionX: 0,
          gridPositionY: 0,
          visible: true,
          items: [
            {
              name: FIELD_NAME,
              gridPositionX: 0,
              gridPositionY: 0,
              defaultValue: "defaultValue1",
              visible: true
            }
          ]
        }
      ]
    },
    {
      name: "anotherComponentName",
      visible: true,
      order: 0,
      sections: [
        {
          name: "anotherComponentSection",
          gridPositionX: 0,
          gridPositionY: 0,
          visible: true,
          items: [
            {
              name: "anotherComponentField",
              gridPositionX: 0,
              gridPositionY: 0,
              defaultValue: undefined,
              visible: true
            }
          ]
        }
      ]
    }
  ]
};

describe("Form Template Utils", () => {
  describe("getFormTemplateComponent helper function", () => {
    test("If any of the props are undefined, it should return undefined", () => {
      expect(
        getFormTemplateComponent(undefined, COMPONENT_NAME)
      ).toBeUndefined();

      expect(
        getFormTemplateComponent(FORM_TEMPLATE_TEST, undefined)
      ).toBeUndefined();
    });

    test("If the component doesn't exist in the form template, it should return undefined", () => {
      expect(
        getFormTemplateComponent(FORM_TEMPLATE_TEST, "incorrectComponentName")
      ).toBeUndefined();
    });

    test("If the component does exist, the component properties should be returned", () => {
      const componentProps = getFormTemplateComponent(
        FORM_TEMPLATE_TEST,
        COMPONENT_NAME
      );

      // It should exist.
      expect(componentProps).toBeTruthy();

      // Check to ensure the correct field was returned.
      expect(componentProps).toMatchSnapshot();
    });
  });

  describe("getFormTemplateSection helper function", () => {
    test("If any of the props are undefined, it should return undefined", () => {
      expect(
        getFormTemplateSection(undefined, COMPONENT_NAME, SECTION_NAME)
      ).toBeUndefined();

      expect(
        getFormTemplateSection(FORM_TEMPLATE_TEST, undefined, SECTION_NAME)
      ).toBeUndefined();

      expect(
        getFormTemplateSection(FORM_TEMPLATE_TEST, COMPONENT_NAME, undefined)
      ).toBeUndefined();
    });

    test("If the section doesn't exist in the form template, it should return undefined", () => {
      expect(
        getFormTemplateSection(
          FORM_TEMPLATE_TEST,
          "incorrectComponentName",
          SECTION_NAME
        )
      ).toBeUndefined();

      expect(
        getFormTemplateSection(
          FORM_TEMPLATE_TEST,
          COMPONENT_NAME,
          "incorrectSectionName"
        )
      ).toBeUndefined();
    });

    test("If the section does exist, the section properties should be returned", () => {
      const sectionProps = getFormTemplateSection(
        FORM_TEMPLATE_TEST,
        COMPONENT_NAME,
        SECTION_NAME
      );

      // It should exist.
      expect(sectionProps).toBeTruthy();

      // Check to ensure the correct field was returned.
      expect(sectionProps).toMatchSnapshot();
    });
  });

  describe("getFormTemplateField helper function", () => {
    test("If any of the props are undefined, it should return undefined", () => {
      expect(
        getFormTemplateField(
          undefined,
          COMPONENT_NAME,
          SECTION_NAME,
          FIELD_NAME
        )
      ).toBeUndefined();

      expect(
        getFormTemplateField(
          FORM_TEMPLATE_TEST,
          undefined,
          SECTION_NAME,
          FIELD_NAME
        )
      ).toBeUndefined();

      expect(
        getFormTemplateField(
          FORM_TEMPLATE_TEST,
          COMPONENT_NAME,
          undefined,
          FIELD_NAME
        )
      ).toBeUndefined();

      expect(
        getFormTemplateField(
          FORM_TEMPLATE_TEST,
          COMPONENT_NAME,
          SECTION_NAME,
          undefined
        )
      ).toBeUndefined();
    });

    test("If the field doesn't exist in the form template, it should return undefined", () => {
      expect(
        getFormTemplateField(
          FORM_TEMPLATE_TEST,
          "incorrectComponentName",
          SECTION_NAME,
          FIELD_NAME
        )
      ).toBeUndefined();

      expect(
        getFormTemplateField(
          FORM_TEMPLATE_TEST,
          COMPONENT_NAME,
          "incorrectSectionName",
          FIELD_NAME
        )
      ).toBeUndefined();

      expect(
        getFormTemplateField(
          FORM_TEMPLATE_TEST,
          COMPONENT_NAME,
          SECTION_NAME,
          "incorrectFieldName"
        )
      ).toBeUndefined();
    });

    test("If the field does exist, the field properties should be returned", () => {
      const fieldProps = getFormTemplateField(
        FORM_TEMPLATE_TEST,
        COMPONENT_NAME,
        SECTION_NAME,
        FIELD_NAME
      );

      // It should exist.
      expect(fieldProps).toBeTruthy();

      // Check to ensure the correct field was returned.
      expect(fieldProps).toMatchSnapshot();
    });
  });
});
