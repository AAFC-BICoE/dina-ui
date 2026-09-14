import { FormTemplate } from "../../../types/collection-api";
import {
  getComponentValues,
  getFormTemplateCheckboxes,
  getMaterialSampleComponentValues
} from "../formTemplateUtils";

describe("formTemplateUtils", () => {
  describe("getComponentValues", () => {
    it("Nests a dotted item name into an object instead of a flat literal key.", () => {
      const formTemplate: Partial<FormTemplate> = {
        components: [
          {
            name: "material-sample-attachments-component",
            visible: true,
            sections: [
              {
                name: "material-sample-attachments-sections",
                visible: true,
                items: [
                  {
                    name: "attachmentsConfig.allowNew",
                    visible: true,
                    defaultValue: true
                  },
                  {
                    name: "attachmentsConfig.allowExisting",
                    visible: true,
                    defaultValue: false
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = getComponentValues(
        "material-sample-attachments-component",
        formTemplate as FormTemplate,
        false
      );

      // Both fields should be nested under one "attachmentsConfig" object,
      // not stored as two separate flat literal keys:
      expect(result.attachmentsConfig).toEqual({
        allowNew: true,
        allowExisting: false
      });
      expect(result["attachmentsConfig.allowNew"]).toBeUndefined();
      expect(result["attachmentsConfig.allowExisting"]).toBeUndefined();

      // The visibility checkboxes are still tracked with the full dotted key:
      expect(result.templateCheckboxes).toEqual({
        "material-sample-attachments-component.material-sample-attachments-sections.attachmentsConfig.allowNew":
          true,
        "material-sample-attachments-component.material-sample-attachments-sections.attachmentsConfig.allowExisting":
          true
      });
    });

    it("Nests a bracket-indexed item name into an array instead of a flat literal key.", () => {
      const formTemplate: Partial<FormTemplate> = {
        components: [
          {
            name: "collecting-event-component",
            visible: true,
            sections: [
              {
                name: "georeferencing-section",
                visible: true,
                items: [
                  {
                    name: "geoReferenceAssertions[0].dwcDecimalLatitude",
                    visible: true,
                    defaultValue: "45.0"
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = getComponentValues(
        "collecting-event-component",
        formTemplate as FormTemplate,
        false
      );

      expect(result.geoReferenceAssertions).toEqual([
        { dwcDecimalLatitude: "45.0" }
      ]);
      expect(
        result["geoReferenceAssertions[0].dwcDecimalLatitude"]
      ).toBeUndefined();
    });

    it("Ignores items that aren't visible.", () => {
      const formTemplate: Partial<FormTemplate> = {
        components: [
          {
            name: "collecting-event-component",
            visible: true,
            sections: [
              {
                name: "collecting-event-details",
                visible: true,
                items: [
                  { name: "expedition", visible: true, defaultValue: "exp1" },
                  { name: "site", visible: false, defaultValue: "site1" }
                ]
              }
            ]
          }
        ]
      };

      const result = getComponentValues(
        "collecting-event-component",
        formTemplate as FormTemplate,
        false
      );

      expect(result.expedition).toEqual("exp1");
      expect(result.site).toBeUndefined();
      expect(
        result.templateCheckboxes[
          "collecting-event-component.collecting-event-details.expedition"
        ]
      ).toEqual(true);
      expect(
        result.templateCheckboxes[
          "collecting-event-component.collecting-event-details.site"
        ]
      ).toBeUndefined();
    });

    it("Returns undefined when invisibleUndefined is true and the component has no visible items.", () => {
      const formTemplate: Partial<FormTemplate> = {
        components: [
          {
            name: "collecting-event-component",
            visible: true,
            sections: [
              {
                name: "collecting-event-details",
                visible: true,
                items: [{ name: "site", visible: false }]
              }
            ]
          }
        ]
      };

      const result = getComponentValues(
        "collecting-event-component",
        formTemplate as FormTemplate,
        true
      );

      expect(result).toBeUndefined();
    });
  });

  describe("getMaterialSampleComponentValues", () => {
    it("Nests default values for Citation and Association fields, which use dotted/bracketed item names.", () => {
      const formTemplate: Partial<FormTemplate> = {
        group: "aafc",
        components: [
          {
            name: "citations-component",
            visible: true,
            sections: [
              {
                name: "citations-add-section",
                visible: true,
                items: [
                  {
                    name: "citation.title",
                    visible: true,
                    defaultValue: "Default Paper Title"
                  }
                ]
              }
            ]
          },
          {
            name: "associations-component",
            visible: true,
            sections: [
              {
                name: "associations-material-sample-section",
                visible: true,
                items: [
                  {
                    name: "associations[0].associationType",
                    visible: true,
                    defaultValue: "host"
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = getMaterialSampleComponentValues(
        formTemplate as FormTemplate
      );

      expect(result.citation).toEqual({ title: "Default Paper Title" });
      expect(result.associations).toEqual([{ associationType: "host" }]);
      expect(result["citation.title"]).toBeUndefined();
      expect(result["associations[0].associationType"]).toBeUndefined();
    });

    it("Excludes components that aren't visible.", () => {
      const formTemplate: Partial<FormTemplate> = {
        group: "aafc",
        components: [
          {
            name: "citations-component",
            visible: false,
            sections: [
              {
                name: "citations-add-section",
                visible: true,
                items: [
                  {
                    name: "citation.title",
                    visible: true,
                    defaultValue: "Should not appear"
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = getMaterialSampleComponentValues(
        formTemplate as FormTemplate
      );

      expect(result.citation).toBeUndefined();
    });

    it("Excludes the Collecting Event and Organisms components (handled separately).", () => {
      const formTemplate: Partial<FormTemplate> = {
        group: "aafc",
        components: [
          {
            name: "collecting-event-component",
            visible: true,
            sections: [
              {
                name: "collecting-event-details",
                visible: true,
                items: [
                  {
                    name: "expedition",
                    visible: true,
                    defaultValue: "should not appear here"
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = getMaterialSampleComponentValues(
        formTemplate as FormTemplate
      );

      expect(result.expedition).toBeUndefined();
    });
  });

  describe("getFormTemplateCheckboxes", () => {
    it("Builds a flat templateCheckboxes map keyed by component.section.field for every visible item.", () => {
      const formTemplate: Partial<FormTemplate> = {
        components: [
          {
            name: "citations-component",
            sections: [
              {
                name: "citations-add-section",
                items: [
                  { name: "citation.title", visible: true },
                  { name: "citation.doi", visible: false }
                ]
              }
            ]
          }
        ]
      };

      const result = getFormTemplateCheckboxes(formTemplate as FormTemplate);

      expect(result.templateCheckboxes).toEqual({
        "citations-component.citations-add-section.citation.title": true
      });
    });

    it("Returns an empty object when no Form Template is provided.", () => {
      expect(getFormTemplateCheckboxes(undefined)).toEqual({});
    });
  });
});
