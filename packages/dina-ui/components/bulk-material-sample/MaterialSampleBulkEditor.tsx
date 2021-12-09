import {
  ButtonBar,
  DinaForm,
  DoOperationsError,
  FormikButton,
  useApiClient
} from "common-ui";
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import { useMemo, useRef, useState } from "react";
import { Promisable } from "type-fest";
import { MaterialSampleBulkNavigator, SampleWithHooks } from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { MaterialSampleForm } from "../../pages/collection/material-sample/edit";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import { useMaterialSampleSave } from "../collection";

export interface MaterialSampleBulkEditorProps {
  samples: InputResource<MaterialSample>[];
  onSaved: (samples: PersistedResource<MaterialSample>[]) => Promisable<void>;
  disableSampleNameField?: boolean;
  onPreviousClick?: () => void;
}

export function MaterialSampleBulkEditor({
  samples: samplesProp,
  disableSampleNameField,
  onSaved,
  onPreviousClick
}: MaterialSampleBulkEditorProps) {
  // Make sure the samples list doesn't change during this component's lifecycle:
  const samples = useMemo(() => samplesProp, []);

  const sampleHooks = samples.map<SampleWithHooks>((sample, index) => ({
    key: `sample-${index}`,
    sample,
    saveHook: useMaterialSampleSave({ materialSample: sample }),
    formRef: useRef<FormikProps<InputResource<MaterialSample>>>(null)
  }));

  const { bulkEditTab } = useBulkEditTab();

  const { saveAll } = useBulkSampleSave({ sampleHooks, onSaved });

  return (
    <div>
      <DinaForm initialValues={{}}>
        <ButtonBar className="justify-content-end">
          {onPreviousClick && (
            <FormikButton
              className="btn btn-primary previous-button"
              onClick={onPreviousClick}
              buttonProps={() => ({ style: { width: "10rem" } })}
            >
              <DinaMessage id="previous" />
            </FormikButton>
          )}
          <FormikButton
            className="btn btn-primary bulk-save-button"
            onClick={saveAll}
            buttonProps={() => ({ style: { width: "10rem" } })}
          >
            <DinaMessage id="saveAll" />
          </FormikButton>
        </ButtonBar>
      </DinaForm>
      <MaterialSampleBulkNavigator
        samples={sampleHooks}
        extraTabs={[bulkEditTab]}
        renderOneSample={(_sample, index) => (
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

interface BulkSampleSaveParams {
  sampleHooks: SampleWithHooks[];
  onSaved: (samples: PersistedResource<MaterialSample>[]) => Promisable<void>;
}

function useBulkSampleSave({ sampleHooks, onSaved }: BulkSampleSaveParams) {
  const [_error, setError] = useState<unknown | null>(null);
  const { save } = useApiClient();

  async function saveAll() {
    setError(null);
    try {
      // First clear all tab errors:
      for (const { formRef } of sampleHooks) {
        formRef.current?.setStatus(null);
        formRef.current?.setErrors({});
      }

      const saveOperations = await Promise.all(
        sampleHooks.map(async ({ formRef, sample, saveHook }, index) => {
          const formik = formRef.current;

          // These two errors shouldn't happen:
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

          // TODO get rid of this try/catch when we can save
          // the Col Event + Acq event + material sample all at once.
          try {
            return await saveHook.prepareSampleSaveOperation(
              formik.values,
              formik
            );
          } catch (error) {
            if (error instanceof DoOperationsError) {
              // In case of an error involving the intermediary Collecting or Acquisition Event.
              // Rethrow the same error but with the tab's index:
              throw new DoOperationsError(
                error.message,
                error.fieldErrors,
                error.individualErrors.map(operationError => ({
                  ...operationError,
                  index
                }))
              );
            }
            throw error;
          }
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
    } catch (error: unknown) {
      // When there is an error from the bulk save-all operation, put it into the correct form:
      if (error instanceof DoOperationsError) {
        for (const opError of error.individualErrors) {
          const formik = sampleHooks[opError.index].formRef.current;
          if (formik) {
            formik.setStatus(opError.errorMessage);
            formik.setErrors(opError.fieldErrors);
          }
        }
      }
      setError(error);
      throw new Error(
        `Bulk submission error: Check the tabs with a red label.`
      );
    }
  }

  return { saveAll };
}

function useBulkEditTab() {
  const { formatMessage } = useDinaIntl();

  const bulkEditSample = {
    type: "material-sample" as const,
    publiclyReleasable: true
  };
  const bulkEditSampleHook = useMaterialSampleSave({
    materialSample: bulkEditSample
  });
  const bulkEditFormRef = useRef<FormikProps<any>>(null);

  const bulkEditTab = {
    key: "OVERWRITE_VALUES",
    title: formatMessage("editAll"),
    content: (
      <MaterialSampleForm
        buttonBar={() => null}
        materialSampleFormRef={bulkEditFormRef}
        materialSampleSaveHook={bulkEditSampleHook}
        materialSample={bulkEditSample}
        disableAutoNamePrefix={true}
        disableSampleNameField={true}
      />
    )
  };

  return { bulkEditTab };
}
