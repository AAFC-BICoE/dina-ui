import {
  ButtonBar,
  DinaForm,
  DoOperationsError,
  FormikButton,
  SampleWithHooks,
  useApiClient,
  SaveArgs
} from "common-ui";
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import { RefObject, useMemo, useRef, useState } from "react";
import { Promisable } from "type-fest";
import { MaterialSampleBulkNavigator } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { MaterialSampleForm } from "../../pages/collection/material-sample/edit";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import { useMaterialSampleSave } from "../collection";
import { useBulkEditTab } from "./bulk-edit-tab";

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
    formRef: useRef(null)
  }));

  const [initialized, setInitialized] = useState(false);

  const { bulkEditTab, withBulkEditOverrides, bulkEditFormRef } =
    useBulkEditTab({
      sampleHooks,
      hideBulkEditTab: !initialized
    });

  const { saveAll } = useBulkSampleSave({
    sampleHooks,
    onSaved,
    preProcessSample: withBulkEditOverrides,
    bulkEditFormRef
  });

  return (
    <div>
      <DinaForm initialValues={{}}>
        <ButtonBar className="justify-content-end gap-4">
          {onPreviousClick && (
            <FormikButton
              className="btn btn-primary previous-button"
              onClick={onPreviousClick}
              buttonProps={() => ({ style: { width: "13rem" } })}
            >
              <DinaMessage id="goToThePreviousStep" />
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
        renderOneSample={(_sample, index, isSelected) => (
          <MaterialSampleForm
            disableSampleNameField={disableSampleNameField}
            materialSampleFormRef={form => {
              const isLastRefSetter =
                sampleHooks.filter(it => !it.formRef.current).length === 1;
              sampleHooks[index].formRef.current = form;
              if (isLastRefSetter && form) {
                setInitialized(true);
              }
            }}
            materialSampleSaveHook={sampleHooks[index].saveHook}
            buttonBar={null}
            disableAutoNamePrefix={true}
            isOffScreen={!isSelected}
          />
        )}
      />
    </div>
  );
}

interface BulkSampleSaveParams {
  sampleHooks: SampleWithHooks[];
  onSaved: (samples: PersistedResource<MaterialSample>[]) => Promisable<void>;
  preProcessSample?: (
    sample: InputResource<MaterialSample>
  ) => Promise<InputResource<MaterialSample>>;
  bulkEditFormRef: RefObject<FormikProps<InputResource<MaterialSample>>>;
}

function useBulkSampleSave({
  sampleHooks,
  onSaved,
  preProcessSample,
  bulkEditFormRef
}: BulkSampleSaveParams) {
  const [_error, setError] = useState<unknown | null>(null);
  const { save } = useApiClient();

  async function saveAll() {
    setError(null);
    bulkEditFormRef?.current?.setStatus(null);
    bulkEditFormRef?.current?.setErrors({});
    try {
      // First clear all tab errors:
      for (const { formRef } of sampleHooks) {
        formRef.current?.setStatus(null);
        formRef.current?.setErrors({});
      }

      const saveOperations: (SaveArgs<MaterialSample> | null)[] = [];
      for (let index = 0; index < sampleHooks.length; index++) {
        const { formRef, sample, saveHook } = sampleHooks[index];
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

        // TODO get rid of these try/catches when we can save
        // the Col Event + Acq event + material sample all at once.
        try {
          const saveOp = await saveHook.prepareSampleSaveOperation({
            submittedValues: formik.values,
            formik,
            preProcessSample: async original => {
              try {
                return (await preProcessSample?.(original)) ?? original;
              } catch (error: unknown) {
                if (error instanceof DoOperationsError) {
                  // Re-throw as Edit All tab error:
                  throw new DoOperationsError(
                    error.message,
                    error.fieldErrors,
                    error.individualErrors.map(opError => ({
                      ...opError,
                      index: "EDIT_ALL"
                    }))
                  );
                }
                throw error;
              }
            }
          });
          saveOperations.push(saveOp);
        } catch (error: unknown) {
          if (error instanceof DoOperationsError) {
            // Rethrow the error with the tab's index:
            throw new DoOperationsError(
              error.message,
              error.fieldErrors,
              error.individualErrors.map(operationError => ({
                ...operationError,
                index:
                  typeof operationError.index === "number"
                    ? index
                    : operationError.index
              }))
            );
          }
          throw error;
        }
      }

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
          const formik =
            typeof opError.index === "number"
              ? sampleHooks[opError.index].formRef.current
              : bulkEditFormRef.current;

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
