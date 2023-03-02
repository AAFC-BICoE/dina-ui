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
  unitsOptions,
  vocabularyOptionsPath,
  typeOptions,
  readOnly,
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
    formik?.values?.[name] ?? getBulkContextExtensionValues(bulkContext, name);

  // If user changes field extensions in Bulk Edit, write Bulk Edit values to Formik form once
  const [bulkExtensionValuesOverride, setBulkExtensionValuesOverride] =
    useState<boolean>(false);
  if (formik?.values?.[name] && bulkContext && !bulkExtensionValuesOverride) {
    setBulkExtensionValuesOverride(true);
    formik.values[name] = getBulkContextExtensionValues(bulkContext, name);
    extensionValues = formik.values[name];
  }

  function removeBlock(blockPath: string) {
    const blockName = blockPath.split(".").at(-1);
    if (blockName) {
      const { [blockName]: _, ...newExtensionValues } = formik?.values?.[name];
      formik.setFieldValue(name, newExtensionValues);
    }
  }

  function addBlock() {
    const selectedBlockOptions = formik?.values?.[name]
    ? Object.keys(formik?.values?.[name]).map(
        (blockKey) => formik?.values?.[name][blockKey].select
      )
    : [];

    const newBlockOption = blockOptions?.find(
      (blockOption) => !selectedBlockOptions?.includes(blockOption.value)
    );
    let newExtensionValues = {};
    if (newBlockOption) {
      newExtensionValues = {
        ...formik?.values?.[name],
        [newBlockOption.value]: !blockAddable
          ? {
              select: newBlockOption.value,
              rows: { "extensionField-0": "" }
            }
          : {
              select: newBlockOption.value,
              rows: { "extensionField-0": "" },
              vocabularyBased: true
            }
      };
      onBlockSelectChange?.(newBlockOption.value, formik);
    } else {
      newExtensionValues = {
        ...formik?.values?.[name],
        [`extension-${Object.keys(extensionValues)}`]: !blockAddable
          ? {
              select: "",
              rows: { "extensionField-0": "" }
            }
          : {
              select: "",
              rows: { "extensionField-0": "" },
              vocabularyBased: true
            }
      };
    }
    formik.setFieldValue(name, newExtensionValues);
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
                    unitsOptions={unitsOptions}
                    removeBlock={removeBlock}
                    name={`${name}.${blockKey}`}
                    blockKey={blockKey}
                    vocabularyOptionsPath={vocabularyOptionsPath}
                    typeOptions={typeOptions}
                    readOnly={readOnly}
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
  bulkContext: BulkEditTabContextI<KitsuResource> | null,
  name
): any {
  let extensionValues = {};
  bulkContext?.resourceHooks?.forEach((resourceHook: any) => {
    Object.keys(resourceHook.resource[name]).forEach((fieldKey) => {
      if (extensionValues[fieldKey]) {
        Object.keys(resourceHook?.resource?.[name][fieldKey].rows).forEach(
          (extensionKey) => {
            extensionValues[fieldKey].rows[extensionKey] = undefined;
          }
        );
      } else {
        extensionValues[fieldKey] = resourceHook.resource?.[name][fieldKey];
        Object.keys(resourceHook?.resource?.[name][fieldKey].rows).forEach(
          (extensionKey) => {
            extensionValues[fieldKey].rows[extensionKey] = undefined;
          }
        );
      }
    });
  });
  return extensionValues;
}
