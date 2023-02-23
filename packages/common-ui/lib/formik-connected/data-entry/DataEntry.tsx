import { FieldArray, useFormikContext } from "formik";
import { KitsuResource } from "kitsu";
import { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { BulkEditTabContextI, FieldSet, useBulkEditTabContext } from "../..";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { DataBlock } from "./DataBlock";
import { DataEntryFieldProps } from "./DataEntryField";

/* tslint:disable-next-line */
export interface DataEntryProps extends DataEntryFieldProps {}

export function DataEntry({
  legend,
  name,
  blockOptions,
  onBlockSelectChange,
  model,
  unitsOptions,
  vocabularyOptionsPath,
  typeOptions,
  readOnly,
  selectedBlockOptions,
  setSelectedBlockOptions,
  id,
  blockAddable = false,
  unitsAddable = false,
  typesAddable = false,
  isVocabularyBasedEnabledForBlock = false,
  isVocabularyBasedEnabledForType = false
}: DataEntryProps) {
  const formik = useFormikContext<any>();
  const bulkContext = useBulkEditTabContext();
  let extensionValues =
    formik?.values?.extensionValues ??
    getBulkContextExtensionValues(bulkContext);

  // If user changes field extensions in Bulk Edit, write Bulk Edit values to Formik form once
  const [bulkExtensionValuesOverride, setBulkExtensionValuesOverride] =
    useState<boolean>(false);
  if (
    formik?.values?.extensionValues &&
    bulkContext &&
    !bulkExtensionValuesOverride
  ) {
    setBulkExtensionValuesOverride(true);
    formik.values.extensionValues = getBulkContextExtensionValues(bulkContext);
    extensionValues = formik.values.extensionValues;
  }

  function removeBlock(blockPath) {
    const blockName = blockPath.split(".").at(-1);
    const { [blockName]: _, ...newExtensionValues } =
      formik?.values?.extensionValues;
    if (setSelectedBlockOptions) {
      setSelectedBlockOptions(
        selectedBlockOptions.filter((item) => item !== blockName)
      );
    }
    formik.setFieldValue("extensionValues", newExtensionValues);
  }

  function addBlock() {
    const newBlockOption = blockOptions?.find(
      (blockOption) => !selectedBlockOptions.includes(blockOption.value)
    );
    if (newBlockOption) {
      let newExtensionValues = {
        ...formik?.values?.extensionValues,
        [newBlockOption.value]: {
          select: newBlockOption.value,
          rows: { "extensionField-0": "" }
        }
      };
      formik.setFieldValue("extensionValues", newExtensionValues);
      onBlockSelectChange?.(newBlockOption.value, formik);
    }
  }
  // Make SelectField component load initial values if they exist
  useEffect(() => {
    if (onBlockSelectChange) {
      if (extensionValues) {
        Object.keys(extensionValues)?.forEach((blockKey) => {
          if (blockKey) {
            onBlockSelectChange(blockKey, undefined);
          }
        });
      }
    }
  }, []);
  function legendWrapper():
    | ((legendElement: JSX.Element) => JSX.Element)
    | undefined {
    return (legendElement) => {
      return (
        <div className="d-flex align-items-center justify-content-between">
          {legendElement}
          {!readOnly && (
            <Button onClick={() => addBlock()} className="add-datablock">
              <DinaMessage id="addCustomPlaceName" />
            </Button>
          )}
        </div>
      );
    };
  }
  return (
    <FieldSet legend={legend} wrapLegend={legendWrapper()} id={id}>
      {
        <div style={{ padding: 15 }}>
          {extensionValues
            ? Object.keys(extensionValues).map((blockKey) => {
                return (
                  <DataBlock
                    blockOptions={blockOptions}
                    onBlockSelectChange={onBlockSelectChange}
                    model={model}
                    unitsOptions={unitsOptions}
                    removeBlock={removeBlock}
                    name={`${name}.${blockKey}`}
                    blockKey={blockKey}
                    vocabularyOptionsPath={vocabularyOptionsPath}
                    typeOptions={typeOptions}
                    readOnly={readOnly}
                    selectedBlockOptions={selectedBlockOptions}
                    blockAddable={blockAddable}
                    unitsAddable={unitsAddable}
                    typesAddable={typesAddable}
                    isVocabularyBasedEnabledForBlock={
                      isVocabularyBasedEnabledForBlock
                    }
                    isVocabularyBasedEnabledForType={
                      isVocabularyBasedEnabledForType
                    }
                    extensionValues={extensionValues}
                  />
                );
              })
            : null}
        </div>
      }
    </FieldSet>
  );
}

/**
 * Gets extensionValues from individual Material Samples to be displayed in bulk edit tab
 * @param bulkContext
 * @returns extensionValues taken from individual Material Samples used for displaying in bulk edit tab
 */
function getBulkContextExtensionValues(
  bulkContext: BulkEditTabContextI<KitsuResource> | null
): any {
  let extensionValues = {};
  bulkContext?.resourceHooks?.forEach((resourceHook: any) => {
    Object.keys(resourceHook.resource.extensionValues).forEach((fieldKey) => {
      if (extensionValues[fieldKey]) {
        Object.keys(
          resourceHook?.resource?.extensionValues[fieldKey].rows
        ).forEach((extensionKey) => {
          extensionValues[fieldKey].rows[extensionKey] = undefined;
        });
      } else {
        extensionValues[fieldKey] =
          resourceHook.resource.extensionValues[fieldKey];
        Object.keys(
          resourceHook?.resource?.extensionValues[fieldKey].rows
        ).forEach((extensionKey) => {
          extensionValues[fieldKey].rows[extensionKey] = undefined;
        });
      }
    });
  });
  return extensionValues;
}
