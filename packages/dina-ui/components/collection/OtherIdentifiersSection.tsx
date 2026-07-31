import {
  AreYouSureModal,
  CheckBoxWithoutWrapper,
  DateField,
  FieldSet,
  NumberField,
  SelectField,
  StringToggleField,
  TextField,
  useDinaFormContext,
  useFieldLabels,
  useModal
} from "common-ui/lib";
import { FieldArray, useFormikContext } from "formik";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { FaMinus, FaPlus } from "react-icons/fa";
import { getFormTemplateCheckboxes } from "../form-template/formTemplateUtils";
import { useState } from "react";
import useControlledVocabularyOptions from "../controlled-vocabulary/useControlledVocabularyOptions";

export interface OtherIdentifiersSectionProps {
  /** Controlled vocabulary UUID for identifier types. */
  controlledVocabularyUuid: string;
  /** dinaComponent filter value for the controlled vocabulary API. */
  dinaComponent: string;
  /** Field label key for the resource type, used in bulk edit warnings. */
  resourceLabelKey: string;
  /** Template checkbox path prefix. */
  templateCheckboxPrefix: string;
  /** The field name for the identifier value. Defaults to "value". */
  valueFieldName?: string;
  /** Hide the dwcOtherCatalogNumbers section. */
  hideOtherCatalogNumbers?: boolean;
}

export function OtherIdentifiersSection({
  controlledVocabularyUuid,
  dinaComponent,
  resourceLabelKey,
  templateCheckboxPrefix = "identifiers-component",
  valueFieldName = "value",
  hideOtherCatalogNumbers = false
}: OtherIdentifiersSectionProps) {
  const { readOnly, isTemplate, formTemplate, isBulkEditAllTab } =
    useDinaFormContext();
  const { values } = useFormikContext();
  const { getFieldLabel } = useFieldLabels();
  const { openModal } = useModal();

  const { vocabOptions, controlledVocabularies } =
    useControlledVocabularyOptions({
      path: `collection-api/controlled-vocabulary-item?filter[controlledVocabulary.uuid][EQ]=${controlledVocabularyUuid}&filter[dinaComponent][EQ]=${dinaComponent}`
    });

  // Determine if the form template sections should be visible.
  const visibility = getFormTemplateCheckboxes(formTemplate);
  const otherIdentifiersVisible = readOnly
    ? Object.keys((values as any)?.identifiers ?? {})?.length !== 0
    : formTemplate
    ? visibility?.templateCheckboxes?.[
        `${templateCheckboxPrefix}.identifiers-section.identifiers`
      ] ?? false
    : true;
  const otherCatalogNumbersVisible = hideOtherCatalogNumbers
    ? false
    : readOnly
    ? !!(values as any)?.dwcOtherCatalogNumbers
    : formTemplate
    ? visibility?.templateCheckboxes?.[
        `${templateCheckboxPrefix}.identifiers-section.dwcOtherCatalogNumbers`
      ] ?? false
    : true;

  const [
    bulkEditOtherIdentifiersOverride,
    setBulkEditOtherIdentifiersOverride
  ] = useState<boolean>(isBulkEditAllTab === undefined);
  const [bulkEditCatalogNumbersOverride, setBulkEditCatalogNumbersOverride] =
    useState<boolean>(isBulkEditAllTab === undefined);

  // If both are not visible, do not display the section.
  if (
    otherIdentifiersVisible === false &&
    otherCatalogNumbersVisible === false
  ) {
    return <></>;
  }

  const resourceTypeLabel = getFieldLabel({
    name: resourceLabelKey
  }).fieldLabel;
  const otherIdentifierLabel = getFieldLabel({
    name: "otherIdentifiers"
  }).fieldLabel.replace(/s$/, "");
  const otherCatalogNumberLabel = getFieldLabel({
    name: "dwcOtherCatalogNumbers"
  }).fieldLabel.replace(/s$/, "");

  return (
    <FieldSet
      legend={<DinaMessage id={"otherIdentifiers"} />}
      wrapLegend={() => <></>}
      id="identifierLegend"
    >
      {otherIdentifiersVisible && bulkEditOtherIdentifiersOverride && (
        <FieldArray name="identifiers">
          {({ form, push, remove }) => {
            const identifiers = form?.values?.identifiers ?? [];
            const selectedTypes = identifiers?.map?.((obj) => obj.type) ?? [];

            // If empty, just display one.
            if (identifiers?.length === 0 && !readOnly) {
              push({});
            }

            function addIdentifier() {
              push({});
            }

            function removeIdentifier(index: number) {
              remove(index);
            }

            function containsEmptyObject() {
              return (
                identifiers?.some?.((obj) => Object.keys(obj).length === 0) ??
                false
              );
            }

            // Add button should be disabled if there is already an empty option being displayed or out of types to use.
            const disableAddButton =
              selectedTypes.length === vocabOptions.length ||
              containsEmptyObject();

            return (
              <div className={`identifier-section`}>
                {/* Top header, where the plus icon is displayed */}
                <div className="row">
                  <div className="col-md-8 d-flex">
                    {isTemplate && (
                      <div style={{ marginTop: "20px", marginRight: "20px" }}>
                        <CheckBoxWithoutWrapper
                          name={`templateCheckboxes['${templateCheckboxPrefix}.identifiers-section.identifiers']`}
                          className={`col-sm-1 templateCheckBox`}
                        />
                      </div>
                    )}
                    <h2 className="fieldset-h2-adjustment">
                      <DinaMessage id="otherIdentifiers" />
                    </h2>
                  </div>
                  <div className="col-md-4 d-flex align-items-center justify-content-between">
                    {!readOnly && (
                      <FaPlus
                        className="ms-auto"
                        style={{
                          cursor: disableAddButton ? "not-allowed" : "pointer",
                          color: disableAddButton ? "gray" : "black"
                        }}
                        onClick={() => {
                          if (!disableAddButton) {
                            addIdentifier();
                          }
                        }}
                        size="2em"
                        onMouseOver={(event) => {
                          if (!disableAddButton) {
                            event.currentTarget.style.color = "blue";
                          }
                        }}
                        onMouseOut={(event) => {
                          if (disableAddButton) {
                            event.currentTarget.style.color = "gray";
                          } else {
                            event.currentTarget.style.color = "black";
                          }
                        }}
                        data-testid="add row button"
                      />
                    )}
                  </div>
                </div>

                {/* Warning message if overriding all */}
                {bulkEditOtherIdentifiersOverride && isBulkEditAllTab && (
                  <div className="alert alert-warning">
                    <DinaMessage
                      id="bulkEditResourceSetWarningMulti"
                      values={{
                        targetType: resourceTypeLabel,
                        fieldName: otherIdentifierLabel
                      }}
                    />
                  </div>
                )}

                {/* Each of other identifier rows to be displayed */}
                {identifiers?.map?.((identifier, index) => {
                  // Retrieve the controlled vocabulary based on the ID selected. By default, string is used.
                  const identifierType =
                    controlledVocabularies?.find?.(
                      (vocab) => vocab?.id === identifier?.type
                    )?.vocabularyElementType ?? "STRING";
                  const commonProps = {
                    name: `identifiers[${index}].${valueFieldName}`,
                    hideLabel: true,
                    disableTemplateCheckbox: true,
                    disabled: isTemplate
                  };

                  return (
                    <div className="row" key={index}>
                      <div
                        className={readOnly ? "col-md-2" : "col-md-5"}
                        data-testid={"identifiers[" + index + "].type"}
                      >
                        <SelectField
                          name={"identifiers[" + index + "].type"}
                          options={vocabOptions}
                          filterValues={selectedTypes}
                          readOnlyRender={(optionValue) => (
                            <strong>
                              {vocabOptions.find(
                                (item) => item.value === optionValue
                              )?.label ??
                                optionValue ??
                                ""}
                              :
                            </strong>
                          )}
                          disableTemplateCheckbox={true}
                          disabled={isTemplate}
                          hideLabel={true}
                        />
                      </div>
                      <div
                        className="col-md-6"
                        data-testid={`identifiers[${index}].${valueFieldName}`}
                      >
                        {identifierType === "STRING" && (
                          <TextField {...commonProps} />
                        )}
                        {identifierType === "DATE" && (
                          <DateField {...commonProps} />
                        )}
                        {identifierType === "INTEGER" && (
                          <NumberField {...commonProps} isInteger={true} />
                        )}
                        {identifierType === "DECIMAL" && (
                          <NumberField {...commonProps} isInteger={false} />
                        )}
                        {identifierType === "BOOL" && (
                          <StringToggleField {...commonProps} />
                        )}
                      </div>
                      <div className="col-md-1 d-flex align-items-center justify-content-between">
                        {!readOnly && (
                          <FaMinus
                            className="ms-auto"
                            style={{ marginTop: "-10px", cursor: "pointer" }}
                            onClick={() => removeIdentifier(index)}
                            size="2em"
                            onMouseOver={(event) =>
                              (event.currentTarget.style.color = "blue")
                            }
                            onMouseOut={(event) =>
                              (event.currentTarget.style.color = "")
                            }
                            data-testid="add row button"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }}
        </FieldArray>
      )}
      {!bulkEditOtherIdentifiersOverride && (
        <>
          <h2 className="fieldset-h2-adjustment">
            <DinaMessage id="otherIdentifiers" />
          </h2>
          <div className="d-flex mb-2">
            <button
              className="btn btn-primary override-all-button-identifiers"
              onClick={() =>
                openModal(
                  <AreYouSureModal
                    actionMessage={
                      <DinaMessage
                        id="overrideAllConfirmationTitle"
                        values={{ fieldName: otherIdentifierLabel }}
                      />
                    }
                    messageBody={
                      <DinaMessage
                        id="overrideAllConfirmation"
                        values={{ fieldName: otherIdentifierLabel }}
                      />
                    }
                    onYesButtonClicked={() =>
                      setBulkEditOtherIdentifiersOverride(true)
                    }
                  />
                )
              }
            >
              <DinaMessage id="overrideAll" />
            </button>
          </div>
        </>
      )}

      {otherCatalogNumbersVisible && bulkEditCatalogNumbersOverride && (
        <FieldArray name="dwcOtherCatalogNumbers">
          {({ form, push, remove }) => {
            const otherCatalogNumbers =
              form?.values?.dwcOtherCatalogNumbers ?? [];

            // If empty, just display one.
            if (otherCatalogNumbers.length === 0) {
              push("");
            }

            function addCatalogNumber() {
              push("");
            }

            function removeCatalogNumber(index: number) {
              remove(index);
            }

            function containsEmptyObject() {
              return (
                otherCatalogNumbers.some(
                  (obj) => Object.keys(obj).length === 0
                ) || otherCatalogNumbers.find((obj) => obj.value === "")
              );
            }

            const disableAddButton = containsEmptyObject();

            return (
              <div className="other-catalogue-numbers-section">
                {/* Top header, where the plus icon is displayed */}
                <div
                  className="row"
                  style={{
                    borderTop: !otherIdentifiersVisible
                      ? "0px solid white"
                      : "1px solid lightgray",
                    paddingTop: "15px"
                  }}
                >
                  <div className="col-md-8 d-flex">
                    {isTemplate && (
                      <div style={{ marginTop: "3px", marginRight: "20px" }}>
                        <CheckBoxWithoutWrapper
                          name={`templateCheckboxes['${templateCheckboxPrefix}.identifiers-section.dwcOtherCatalogNumbers']`}
                          className={`col-sm-1 templateCheckBox`}
                        />
                      </div>
                    )}
                    <strong>
                      <DinaMessage id={"field_dwcOtherCatalogNumbers"} />
                    </strong>
                  </div>
                  <div className="col-md-4 d-flex align-items-center justify-content-between">
                    {!readOnly && (
                      <FaPlus
                        className="ms-auto"
                        style={{
                          cursor: disableAddButton ? "not-allowed" : "pointer",
                          color: disableAddButton ? "gray" : "black"
                        }}
                        onClick={() => {
                          if (!disableAddButton) {
                            addCatalogNumber();
                          }
                        }}
                        size="2em"
                        onMouseOver={(event) => {
                          if (!disableAddButton) {
                            event.currentTarget.style.color = "blue";
                          }
                        }}
                        onMouseOut={(event) => {
                          if (disableAddButton) {
                            event.currentTarget.style.color = "gray";
                          } else {
                            event.currentTarget.style.color = "black";
                          }
                        }}
                        data-testid="add row button"
                      />
                    )}
                  </div>
                </div>

                {/* Warning message if overriding all */}
                {bulkEditCatalogNumbersOverride && isBulkEditAllTab && (
                  <div className="alert alert-warning">
                    <DinaMessage
                      id="bulkEditResourceSetWarningMulti"
                      values={{
                        targetType: resourceTypeLabel,
                        fieldName: otherCatalogNumberLabel
                      }}
                    />
                  </div>
                )}

                {/* Each of other catalog numbers rows to be displayed */}
                {!readOnly &&
                  otherCatalogNumbers?.map((_, index) => (
                    <div className="row" key={index}>
                      <div
                        className="col-md-11"
                        data-testid={"dwcOtherCatalogNumbers[" + index + "]"}
                      >
                        <TextField
                          name={"dwcOtherCatalogNumbers[" + index + "]"}
                          hideLabel={true}
                          disableTemplateCheckbox={true}
                          disabled={isTemplate}
                        />
                      </div>
                      <div className="col-md-1 d-flex align-items-center justify-content-between">
                        {!readOnly && (
                          <FaMinus
                            className="ms-auto"
                            style={{ marginTop: "-10px", cursor: "pointer" }}
                            onClick={() => removeCatalogNumber(index)}
                            size="2em"
                            onMouseOver={(event) =>
                              (event.currentTarget.style.color = "blue")
                            }
                            onMouseOut={(event) =>
                              (event.currentTarget.style.color = "")
                            }
                            data-testid="add row button"
                          />
                        )}
                      </div>
                    </div>
                  ))}

                {/* Read-only mode, display it like an array. */}
                {readOnly && (
                  <p className="mt-2">{otherCatalogNumbers.join(", ")}</p>
                )}
              </div>
            );
          }}
        </FieldArray>
      )}
      {!bulkEditCatalogNumbersOverride && (
        <>
          <strong>
            <DinaMessage id={"field_dwcOtherCatalogNumbers"} />
          </strong>
          <div className="d-flex mt-2">
            <button
              className="btn btn-primary override-all-button-catalog-numbers"
              onClick={() =>
                openModal(
                  <AreYouSureModal
                    actionMessage={
                      <DinaMessage
                        id="overrideAllConfirmationTitle"
                        values={{ fieldName: otherCatalogNumberLabel }}
                      />
                    }
                    messageBody={
                      <DinaMessage
                        id="overrideAllConfirmation"
                        values={{ fieldName: otherCatalogNumberLabel }}
                      />
                    }
                    onYesButtonClicked={() =>
                      setBulkEditCatalogNumbersOverride(true)
                    }
                  />
                )
              }
            >
              <DinaMessage id="overrideAll" />
            </button>
          </div>
        </>
      )}
    </FieldSet>
  );
}
