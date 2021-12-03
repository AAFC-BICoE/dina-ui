import { ButtonBar, DinaForm, FormikButton, useApiClient } from "common-ui";
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import { useMemo, useRef } from "react";
import { Promisable } from "type-fest";
import { MaterialSampleBulkNavigator } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { MaterialSampleForm } from "../../pages/collection/material-sample/edit";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import { useMaterialSampleSave } from "../collection";

export interface MaterialSampleBulkEditorProps {
  samples: InputResource<MaterialSample>[];
  onSaved: (samples: PersistedResource<MaterialSample>[]) => Promisable<void>;
  disableSampleNameField?: boolean;
}

export function MaterialSampleBulkEditor({
  samples: samplesProp,
  disableSampleNameField,
  onSaved
}: MaterialSampleBulkEditorProps) {
  // Make sure the samples list doesn't change during this component's lifecycle:
  const samples = useMemo(() => samplesProp, []);

  const sampleHooks = samples.map(sample => ({
    sample,
    saveHook: useMaterialSampleSave({ materialSample: sample }),
    formRef: useRef<FormikProps<InputResource<MaterialSample>>>(null)
  }));

  const { save } = useApiClient();

  async function saveAll() {
    const saveOperations = await Promise.all(
      sampleHooks.map(({ formRef, sample, saveHook }) => {
        const formik = formRef.current;
        if (!formik) {
          throw new Error(
            `Missing Formik ref for sample ${sample.materialSampleName}`
          );
        }
        if (!saveHook) {
          throw new Error(
            `Missing Save Hook for sample ${sample.materialSampleName}`
          );
        }

        return saveHook.prepareSampleSaveOperation(formik.values, formik);
      })
    );

    const validOperations = saveOperations.map(op => {
      if (!op) {
        throw new Error("Some material sample saves failed.");
      }
      return op;
    });

    const savedSamples = await save<MaterialSample>(validOperations, {
      apiBaseUrl: "/collection-api"
    });

    await onSaved(savedSamples);
  }

  return (
    <div>
      <DinaForm initialValues={{}}>
        <ButtonBar>
          <FormikButton
            className="btn btn-primary ms-auto bulk-save-button"
            onClick={saveAll}
          >
            <DinaMessage id="saveAll" />
          </FormikButton>
        </ButtonBar>
      </DinaForm>
      <MaterialSampleBulkNavigator
        samples={samples}
        renderOneSample={(_, index) => (
          <MaterialSampleForm
            disableSampleNameField={disableSampleNameField}
            materialSampleFormRef={sampleHooks[index].formRef}
            materialSampleSaveHook={sampleHooks[index].saveHook}
            buttonBar={() => null}
            disableAutoNamePrefix={true}
          />
        )}
      />
    </div>
  );
}
