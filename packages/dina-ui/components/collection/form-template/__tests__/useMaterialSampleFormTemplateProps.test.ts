import { renderHook } from "@testing-library/react";
import { useMaterialSampleFormTemplateProps } from "../useMaterialSampleFormTemplateProps";
import { MaterialSampleFormTemplateConfig } from "../materialSampleFormViewConfigSchema";

function testConfig(
  collectingEventTemplateFields: Record<string, any> = {}
): MaterialSampleFormTemplateConfig {
  return {
    type: "material-sample-form-template",
    formTemplate: {
      MATERIAL_SAMPLE: { templateFields: {} },
      COLLECTING_EVENT: { templateFields: collectingEventTemplateFields }
    }
  };
}

describe("useMaterialSampleFormTemplateProps", () => {
  it("Does not conjure a Primary geo-assertion when Georeferencing is left unconfigured.", () => {
    const { result } = renderHook(() =>
      useMaterialSampleFormTemplateProps(testConfig())
    );

    expect(
      result.current?.collectingEventInitialValues?.geoReferenceAssertions
    ).toEqual([]);
  });

  it("Marks the first assertion Primary when the template configured a Georeference default.", () => {
    const { result } = renderHook(() =>
      useMaterialSampleFormTemplateProps(
        testConfig({
          geoReferenceAssertions: {
            enabled: true,
            defaultValue: [{ dwcDecimalLatitude: 45 }]
          }
        })
      )
    );

    expect(
      result.current?.collectingEventInitialValues?.geoReferenceAssertions
    ).toEqual([{ dwcDecimalLatitude: 45, isPrimary: true }]);
  });

  it("Links an existing Collecting Event by id instead of populating a blank Georeference default.", () => {
    const { result } = renderHook(() =>
      useMaterialSampleFormTemplateProps(
        testConfig({
          id: { enabled: true, defaultValue: "existing-col-event-id" }
        })
      )
    );

    expect(
      result.current?.materialSampleInitialValues?.collectingEvent
    ).toEqual({
      type: "collecting-event",
      id: "existing-col-event-id"
    });
    expect(result.current?.collectingEventInitialValues).toBeUndefined();
  });
});
