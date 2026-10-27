import {
  CheckBoxField,
  FieldSet,
  INLINE_LABEL_WIDTH,
  TextField,
  useDinaFormContext
} from "common-ui";
import classNames from "classnames";
import { useField } from "formik";
import { FaCheck, FaCircleInfo, FaWandMagicSparkles } from "react-icons/fa6";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  IDENTIFIER_COMPONENT_NAME,
  MaterialSample
} from "../../../types/collection-api";
import { OtherIdentifiersSection } from "../OtherIdentifiersSection";
import { COLLECTION_OTHER_IDENTIFIERS_ID } from "../../controlled-vocabulary/controlledVocabularyItemUtils";

export interface MaterialSampleIdentifiersSectionProps {
  disableSampleNameField?: boolean;
  hideOtherCatalogNumbers?: boolean;
  className?: string;
  namePrefix?: string;
  sampleNamePlaceHolder?: string;
  id?: string;
  hideUseSequence?: boolean;
}

/** The fields in the Identifiers section. */
export const IDENTIFIERS_FIELDS: (keyof MaterialSample)[] = [
  "collection",
  "materialSampleName",
  "dwcOtherCatalogNumbers",
  "barcode",
  "identifiers"
];

/** Fields layout re-useable between view and edit pages. */
export function MaterialSampleIdentifiersSection({
  disableSampleNameField,
  className,
  namePrefix = "",
  sampleNamePlaceHolder,
  hideUseSequence,
  id = IDENTIFIER_COMPONENT_NAME
}: MaterialSampleIdentifiersSectionProps) {
  const { formatMessage } = useDinaIntl();
  const { readOnly, isTemplate, initialValues } = useDinaFormContext();
  const [{ value: collection }] = useField("collection");
  const [{ value: nextSequenceValue }, , { setValue: setUseNextSequence }] =
    useField<boolean | undefined>("useNextSequence");
  const hasCollection = !!collection?.id;
  // Save only uses the sequence when a collection is set, so show it off without one.
  const useNextSequence = hasCollection && !!nextSequenceValue;

  // The ID is generated on save, which only applies to new samples.
  const showNextAvailable =
    !readOnly && !isTemplate && !hideUseSequence && !initialValues.id;

  return (
    <FieldSet
      id={id}
      legend={<DinaMessage id="identifiers" />}
      className={className}
      componentName={IDENTIFIER_COMPONENT_NAME}
      sectionName="identifiers-section"
      horizontal={INLINE_LABEL_WIDTH}
      compact={true}
    >
      <TextField
        disableTemplateCheckbox={true}
        name={`${namePrefix}materialSampleName`}
        customName="materialSampleName"
        className="materialSampleName"
        readOnly={disableSampleNameField}
        placeholder={sampleNamePlaceHolder}
        customInput={
          showNextAvailable
            ? (inputProps) => (
                <div className="flex-grow-1">
                  <div className="d-flex gap-2">
                    {/* The typed name stays in the form and comes back when Next available is turned off. */}
                    <input
                      type="text"
                      {...inputProps}
                      disabled={inputProps.disabled || useNextSequence}
                      value={useNextSequence ? "" : inputProps.value}
                      placeholder={
                        useNextSequence
                          ? formatMessage("assignedOnSave")
                          : inputProps.placeholder
                      }
                      className={classNames(
                        inputProps.className,
                        useNextSequence && "fst-italic"
                      )}
                    />
                    <button
                      type="button"
                      className={classNames(
                        "btn text-nowrap",
                        // Bootstrap's disabled outline-primary is bright blue, so use gray while disabled.
                        !hasCollection
                          ? "btn-outline-secondary btn-gray-text"
                          : useNextSequence
                          ? "btn-primary"
                          : "btn-outline-primary"
                      )}
                      disabled={!hasCollection}
                      aria-pressed={useNextSequence}
                      onClick={() => setUseNextSequence(!useNextSequence)}
                    >
                      {useNextSequence ? (
                        <FaCheck className="me-2" />
                      ) : (
                        <FaWandMagicSparkles className="me-2" />
                      )}
                      <DinaMessage id="nextAvailable" />
                    </button>
                  </div>
                  {!hasCollection && (
                    <div className="small text-muted mt-1 d-flex align-items-center gap-1">
                      <FaCircleInfo style={{ color: "#335075" }} />
                      <DinaMessage id="setCollectionToUseNextAvailable" />
                    </div>
                  )}
                </div>
              )
            : undefined
        }
      />
      {/* Form templates can still set a default for Next available. */}
      {isTemplate && !hideUseSequence && (
        <CheckBoxField name="useNextSequence" />
      )}
      <TextField name={`${namePrefix}barcode`} customName="barcode" />
      <OtherIdentifiersSection
        controlledVocabularyUuid={COLLECTION_OTHER_IDENTIFIERS_ID}
        dinaComponent="MATERIAL_SAMPLE"
        resourceLabelKey="material-sample"
        templateCheckboxPrefix={IDENTIFIER_COMPONENT_NAME}
      />
    </FieldSet>
  );
}
