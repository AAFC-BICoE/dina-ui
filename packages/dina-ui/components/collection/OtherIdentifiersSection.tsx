import {
  AreYouSureModal,
  Chip,
  ChipList,
  ChipsArrayField,
  FieldWrapper,
  useDinaFormContext,
  useFieldLabels,
  useModal
} from "common-ui";
import { useFormikContext } from "formik";
import { useState } from "react";
import Select from "react-select";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { getFormTemplateCheckboxes } from "../form-template/formTemplateUtils";
import useControlledVocabularyOptions from "../controlled-vocabulary/useControlledVocabularyOptions";
import styles from "./OtherIdentifiersSection.module.css";

export interface OtherIdentifiersSectionProps {
  /** Controlled vocabulary UUID for identifier types. */
  controlledVocabularyUuid: string;
  /** dinaComponent filter value for the controlled vocabulary API. */
  dinaComponent: string;
  /** Field label key for the resource type, used in bulk edit warnings. */
  resourceLabelKey: string;
  /** Template checkbox path prefix. Defaults to "identifiers-component". */
  templateCheckboxPrefix?: string;
  /** The field name for the identifier value. Defaults to "value". */
  valueFieldName?: string;
  /** Hide the dwcOtherCatalogNumbers section. */
  hideOtherCatalogNumbers?: boolean;
}

/** Input types for identifier values, by vocabulary element type. Text by default. */
const VALUE_INPUT_TYPES: Record<string, string> = {
  DATE: "date",
  INTEGER: "number",
  DECIMAL: "number"
};

export function OtherIdentifiersSection({
  controlledVocabularyUuid,
  dinaComponent,
  resourceLabelKey,
  templateCheckboxPrefix = "identifiers-component",
  valueFieldName = "value",
  hideOtherCatalogNumbers = false
}: OtherIdentifiersSectionProps) {
  const { readOnly, isTemplate, formTemplate, isBulkEditAllTab, horizontal } =
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

  const typeLabel = (type: string) =>
    vocabOptions.find((option) => option.value === type)?.label ?? type;

  // Chip rows can grow taller, so line the label up with the first line in the inline layout.
  const chipFieldClass = horizontal ? styles.chipField : undefined;

  /** Bulk edit "Edit All" warning shown while a field overrides every sample. */
  function overrideWarning(fieldName: string) {
    return isBulkEditAllTab ? (
      <div className="alert alert-warning">
        <DinaMessage
          id="bulkEditResourceSetWarningMulti"
          values={{ targetType: resourceTypeLabel, fieldName }}
        />
      </div>
    ) : null;
  }

  /** Bulk edit "Edit All" button to start overriding a field for every sample. */
  function overrideButton(
    setOverride: (override: boolean) => void,
    fieldName: string,
    className: string
  ) {
    return (
      <button
        type="button"
        className={`btn btn-primary ${className}`}
        onClick={() =>
          openModal(
            <AreYouSureModal
              actionMessage={
                <DinaMessage
                  id="overrideAllConfirmationTitle"
                  values={{ fieldName }}
                />
              }
              messageBody={
                <DinaMessage
                  id="overrideAllConfirmation"
                  values={{ fieldName }}
                />
              }
              onYesButtonClicked={() => setOverride(true)}
            />
          )
        }
      >
        <DinaMessage id="overrideAll" />
      </button>
    );
  }

  return (
    <>
      {otherCatalogNumbersVisible &&
        (bulkEditCatalogNumbersOverride ? (
          <>
            {overrideWarning(otherCatalogNumberLabel)}
            <ChipsArrayField
              name="dwcOtherCatalogNumbers"
              className={chipFieldClass}
              disabled={isTemplate}
            />
          </>
        ) : (
          <FieldWrapper name="dwcOtherCatalogNumbers" disableLabelClick={true}>
            {() =>
              overrideButton(
                setBulkEditCatalogNumbersOverride,
                otherCatalogNumberLabel,
                "override-all-button-catalog-numbers"
              )
            }
          </FieldWrapper>
        ))}
      {otherIdentifiersVisible && (
        <FieldWrapper
          name="identifiers"
          className={chipFieldClass}
          disableLabelClick={true}
          readOnlyRender={(identifiers) => (
            <ChipList>
              {(identifiers ?? []).map((identifier, index) => (
                <Chip key={index}>
                  <strong>{typeLabel(identifier?.type)}:</strong>{" "}
                  {identifier?.[valueFieldName]}
                </Chip>
              ))}
            </ChipList>
          )}
        >
          {({ value, setValue }) =>
            bulkEditOtherIdentifiersOverride ? (
              <div className="flex-grow-1">
                {overrideWarning(otherIdentifierLabel)}
                <IdentifiersInput
                  // Drop the empty rows the old row-per-identifier form kept around.
                  identifiers={(value ?? []).filter((it) => it?.type)}
                  onChange={setValue}
                  disabled={isTemplate}
                  valueFieldName={valueFieldName}
                  vocabOptions={vocabOptions}
                  typeLabel={typeLabel}
                  elementTypeOf={(type) =>
                    controlledVocabularies?.find?.(
                      (vocab) => vocab?.id === type
                    )?.vocabularyElementType ?? "STRING"
                  }
                />
              </div>
            ) : (
              overrideButton(
                setBulkEditOtherIdentifiersOverride,
                otherIdentifierLabel,
                "override-all-button-identifiers"
              )
            )
          }
        </FieldWrapper>
      )}
    </>
  );
}

/** Other identifiers as "Type: value" chips with one row to add a new pair. */
function IdentifiersInput({
  identifiers,
  onChange,
  disabled,
  valueFieldName,
  vocabOptions,
  typeLabel,
  elementTypeOf
}: {
  identifiers: any[];
  onChange: (identifiers: any[]) => void;
  disabled?: boolean;
  valueFieldName: string;
  vocabOptions: { label: string; value: string }[];
  typeLabel: (type: string) => string;
  elementTypeOf: (type?: string) => string;
}) {
  const { formatMessage } = useDinaIntl();
  const [draftType, setDraftType] = useState<string>();
  const [draftValue, setDraftValue] = useState("");
  const elementType = elementTypeOf(draftType);
  const canAdd = !!draftType && !!draftValue.trim();

  function addDraft() {
    if (canAdd) {
      onChange([
        ...identifiers,
        { type: draftType, [valueFieldName]: draftValue.trim() }
      ]);
      setDraftType(undefined);
      setDraftValue("");
    }
  }

  const valueInputProps = {
    className: elementType === "BOOL" ? "form-select" : "form-control",
    style: { flex: 2 },
    "aria-label": formatMessage("dataValue"),
    disabled,
    value: draftValue,
    onChange: (event) => setDraftValue(event.target.value),
    onKeyDown: (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addDraft();
      } else if (event.key === "Escape") {
        setDraftValue("");
      }
    }
  };

  return (
    <div className="d-flex flex-column gap-2">
      {!!identifiers.length && (
        <ChipList>
          {identifiers.map((identifier, index) => (
            <Chip
              key={index}
              onRemove={
                disabled
                  ? undefined
                  : () => onChange(identifiers.filter((_, i) => i !== index))
              }
              removeLabel={formatMessage("removeValue", {
                value: `${typeLabel(identifier.type)}: ${
                  identifier[valueFieldName] ?? ""
                }`
              })}
            >
              <strong>{typeLabel(identifier.type)}:</strong>{" "}
              {identifier[valueFieldName]}
            </Chip>
          ))}
        </ChipList>
      )}
      <div className="d-flex gap-2">
        <div style={{ flex: 1 }}>
          <Select
            aria-label={formatMessage("otherIdentifiers")}
            classNamePrefix="react-select"
            placeholder={formatMessage("identifierTypePlaceholder")}
            options={vocabOptions.filter(
              (option) => !identifiers.some((it) => it.type === option.value)
            )}
            value={
              vocabOptions.find((option) => option.value === draftType) ?? null
            }
            onChange={(option) => {
              setDraftType(option?.value);
              setDraftValue("");
            }}
            isDisabled={disabled}
            styles={{
              placeholder: (base) => ({ ...base, color: "#5c5c5c" }),
              menu: (base) => ({ ...base, zIndex: 1050 })
            }}
          />
        </div>
        {elementType === "BOOL" ? (
          <select {...valueInputProps}>
            <option value="">{formatMessage("dataValue")}</option>
            <option value="true">{formatMessage("true")}</option>
            <option value="false">{formatMessage("false")}</option>
          </select>
        ) : (
          <input
            {...valueInputProps}
            type={VALUE_INPUT_TYPES[elementType] ?? "text"}
            step={elementType === "DECIMAL" ? "any" : undefined}
            placeholder={formatMessage("dataValue")}
          />
        )}
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled || !canAdd}
          onClick={addDraft}
        >
          <DinaMessage id="add" />
        </button>
      </div>
    </div>
  );
}
