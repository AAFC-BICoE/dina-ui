import { useFormikContext } from "formik";
import _ from "lodash";
import { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import {
  CheckBoxField,
  CreatableSelectField,
  FieldWrapperProps,
  SelectField
} from "../../../../common-ui/lib";
import { DataRow } from "../../../../common-ui/lib";
import { DinaMessage } from "@dina-ui/intl/dina-ui-intl";

export interface DataBlockProps extends FieldWrapperProps {
  removeBlock?: (blockPath) => void;
  readOnly?: boolean;
  blockAddable?: boolean;
  unitsAddable?: boolean;
  typesAddable?: boolean;
  isVocabularyBasedEnabledForBlock?: boolean;
  isVocabularyBasedEnabledForType?: boolean;
  blockKey: string;
  extensionValues: any;
  blockOptions: any[];
  unitsOptions?: any[];
  typeOptions?: any[];
  disableClearButton?: boolean;
}

export function DataBlock({
  removeBlock,
  readOnly,
  blockAddable = false,
  unitsAddable = false,
  typesAddable = false,
  isVocabularyBasedEnabledForBlock = false,
  isVocabularyBasedEnabledForType = false,
  blockKey,
  extensionValues,
  blockOptions,
  unitsOptions,
  typeOptions,
  disableClearButton = false,
  ...props
}: DataBlockProps) {
  const extensionKeys = extensionValues[blockKey].rows;
  const formik = useFormikContext<any>();
  const rootName = props.name.split(".")[0];
  const selectedBlockOptions = formik?.values?.[rootName]
    ? Object.keys(formik?.values?.[rootName]).map(
        (blockKeySelect) => formik?.values?.[rootName][blockKeySelect].select
      )
    : [];

  // Dynamic DataBlock type options that changes based on what DataBlock selection is
  // Make SelectField component load initial values if they exist
  const [dynamicSelectedTypeOptions, setDynamicSelectedTypeOptions] =
    useState<any>(
      getDynamicSelectedTypeOption(extensionValues?.[blockKey].select)
    );

  function onBlockSelectChange(selected, formikCtx, oldValue?) {
    const selectedExtensionFieldsOptions =
      getDynamicSelectedTypeOption(selected);
    setDynamicSelectedTypeOptions(selectedExtensionFieldsOptions);

    // Clear block rows if new block option selected
    if (selected !== oldValue) {
      if (formikCtx?.values?.[rootName]) {
        Object.keys(formikCtx?.values?.[rootName]).forEach((extensionKey) => {
          if (formikCtx?.values?.[rootName][extensionKey].select === oldValue) {
            // Use setFieldValue to cause a rerender
            formikCtx.setFieldValue(`${rootName}.${extensionKey}.rows`, {
              "extensionField-0": ""
            });
          }
        });
      }
    }
  }

  function getDynamicSelectedTypeOption(selected: any) {
    const selectedFieldExtension = blockOptions?.find(
      (data) => data.value === selected
    );

    const selectedExtensionFieldsOptions = selectedFieldExtension?.fields?.map(
      (data) => ({
        label: data.name,
        value: data.key,
        descriptions: data.multilingualDescription?.descriptions,
        unit: data.unit,
        vocabularyElementType: data.vocabularyElementType
      })
    );
    return selectedExtensionFieldsOptions;
  }

  const rowsPath = `${props.name}.rows`;
  const usedTypes = _.compact(_.map(extensionKeys, (row) => row?.type));

  function addRow() {
    const rows = _.get(formik.values, rowsPath) ?? {};
    let index = Object.keys(rows).length;
    // Skip keys still in use after a middle row was removed:
    while (`extensionField-${index}` in rows) {
      index++;
    }
    formik.setFieldValue(rowsPath, {
      ...rows,
      [`extensionField-${index}`]: ""
    });
  }

  function onCreatableSelectFieldChange(value, oldValue) {
    if (isVocabularyBasedEnabledForBlock) {
      formik.setFieldValue(
        `${props.name}.vocabularyBased`,
        !!_.find(blockOptions, (item) => item.value === value)
      );
    }
    if (onBlockSelectChange) {
      onBlockSelectChange(value, formik, oldValue);
    }
  }

  const rowKeys = Object.keys(extensionKeys ?? {});

  return (
    <div className="border rounded data-entry-block">
      <div className="d-flex align-items-center justify-content-between gap-3 px-3 py-2 bg-light border-bottom">
        {blockOptions && (
          <div style={{ width: 280 }}>
            {blockAddable ? (
              <CreatableSelectField
                options={blockOptions}
                name={`${props.name}.select`}
                removeBottomMargin={true}
                removeLabel={true}
                onChange={onCreatableSelectFieldChange}
                disableTemplateCheckbox={true}
                filterValues={selectedBlockOptions}
                readOnlyBold={true}
              />
            ) : (
              <SelectField
                options={blockOptions}
                name={`${props.name}.select`}
                removeBottomMargin={true}
                removeLabel={true}
                onChange={onBlockSelectChange}
                disableTemplateCheckbox={true}
                filterValues={selectedBlockOptions}
                readOnlyBold={true}
              />
            )}
          </div>
        )}
        {isVocabularyBasedEnabledForBlock && (
          <CheckBoxField
            className="hidden"
            name={`${props.name}.vocabularyBased`}
            removeLabel={true}
          />
        )}
        {!readOnly && (
          <button
            type="button"
            className="btn btn-remove-light"
            onClick={() => removeBlock?.(props.name)}
          >
            <FaTrash className="me-2" />
            <DinaMessage id="removeExtension" />
          </button>
        )}
      </div>
      <div className="p-3">
        {rowKeys.length ? (
          <>
            <div className="data-entry-grid mb-1 small fw-bold">
              <div>
                <DinaMessage id="dataType" />
              </div>
              <div>
                <DinaMessage id="dataValue" />
              </div>
              <div>
                <DinaMessage id="unit" />
              </div>
              <div />
            </div>
            {rowKeys.map((extensionKey, rowIndex) => (
              <DataRow
                key={extensionKey}
                name={`${rowsPath}.${extensionKey}`}
                rowIndex={rowIndex}
                usedTypes={usedTypes}
                unitsOptions={unitsOptions}
                typeOptions={typeOptions ?? dynamicSelectedTypeOptions}
                readOnly={readOnly}
                typesAddable={typesAddable}
                unitsAddable={unitsAddable}
                isVocabularyBasedEnabledForType={
                  isVocabularyBasedEnabledForType
                }
                disableClearButton={disableClearButton}
              />
            ))}
          </>
        ) : (
          <div className="text-muted mb-2">
            <DinaMessage id="noRowsFound" />
          </div>
        )}
        {!readOnly && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary btn-gray-text"
            onClick={addRow}
            data-testid="add row button"
          >
            <FaPlus className="me-2" />
            <DinaMessage id="addField" />
          </button>
        )}
      </div>
    </div>
  );
}
