import { FieldArray, useFormikContext } from "formik";
import { KitsuResource } from "kitsu";
import { useEffect, useRef } from "react";
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
  const arrayHelpersRef = useRef<any>(null);
  const formik = useFormikContext<any>();
  const bulkContext = useBulkEditTabContext();

  const extensionValues =
    formik?.values?.extensionValues ??
    getBulkContextExtensionValues(bulkContext);
  function removeBlock(index) {
    const oldValue =
      arrayHelpersRef?.current?.form?.values?.extensionValues?.[index]
        ?.select ??
      arrayHelpersRef?.current?.form?.initialValues?.extensionValues?.[index]
        ?.select;

    if (setSelectedBlockOptions) {
      setSelectedBlockOptions(
        selectedBlockOptions.filter((item) => item !== oldValue)
      );
    }
    arrayHelpersRef.current.remove(index);
  }

  function addBlock() {
    arrayHelpersRef.current.push({ rows: [{}] });
  }
  // Make SelectField component load initial values if they exist
  useEffect(() => {
    if (onBlockSelectChange) {
      if (extensionValues) {
        Object.keys(extensionValues)?.forEach((fieldKey) => {
          if (fieldKey) {
            onBlockSelectChange(fieldKey, undefined);
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
  // arrayHelpersRef.current = fieldArrayProps;
  return (
    <FieldSet legend={legend} wrapLegend={legendWrapper()} id={id}>
      {
        <div style={{ padding: 15 }}>
          {extensionValues
            ? Object.keys(extensionValues).map((fieldKey) => {
                // render all keys except for fieldKey
                return (
                  <DataBlock
                    blockOptions={blockOptions}
                    onBlockSelectChange={onBlockSelectChange}
                    model={model}
                    unitsOptions={unitsOptions}
                    removeBlock={removeBlock}
                    name={`${name}.${fieldKey}`}
                    fieldKey={fieldKey}
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
function getBulkContextExtensionValues(bulkContext: BulkEditTabContextI<KitsuResource> | null): any {
  let extensionValues = {}
  bulkContext?.resourceHooks?.forEach((resourceHook: any) => {
    Object.keys(resourceHook?.resource?.extensionValues).forEach((fieldKey) => {
      if (extensionValues[fieldKey]) {
        Object.keys(resourceHook?.resource?.extensionValues[fieldKey]).forEach((extensionKey) => {
          extensionValues[fieldKey][extensionKey] = resourceHook?.resource?.extensionValues[fieldKey][extensionKey];
        })
      } else {
        extensionValues[fieldKey] = resourceHook?.resource?.extensionValues[fieldKey];
      }
    })
  })
  return extensionValues;
}

