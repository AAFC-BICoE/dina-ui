import {
  AutoSuggestTextField,
  ControlledVocabularySelectField,
  DateField,
  DinaFormSection,
  FieldSet,
  FieldSpy,
  FieldWrapper,
  INLINE_LABEL_WIDTH,
  TextField,
  useDinaFormContext
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../..//intl/dina-ui-intl";
import {
  MANAGED_ATTRIBUTES_COMPONENT_NAME,
  MaterialSample,
  MATERIAL_SAMPLE_INFO_COMPONENT_NAME
} from "../../..//types/collection-api";
import { Vocabulary } from "../../../types/collection-api";
import { MaterialSampleStateReadOnlyRender } from "../MaterialSampleStateWarning";
import _ from "lodash";
import classNames from "classnames";
import { useState } from "react";
import { FaCircleInfo } from "react-icons/fa6";
import styles from "./MaterialSampleInfoSection.module.css";
import { ManagedAttributesEditor } from "../../managed-attributes/ManagedAttributesEditor";
import { VisibleManagedAttributesConfig } from "./MaterialSampleForm";

export const MATERIALSAMPLE_FIELDSET_FIELDS: (keyof MaterialSample)[] = [
  "materialSampleRemarks",
  "materialSampleState",
  "materialSampleType"
];

export function MaterialSampleInfoSection({ id }: { id?: string }) {
  const { locale, formatMessage } = useDinaIntl();

  const { readOnly, isTemplate } = useDinaFormContext();

  const onMaterialSampleStateChanged = (form, _name, value) => {
    if (value === "") {
      form.setFieldValue("stateChangeRemarks", null);
      form.setFieldValue("stateChangedOn", null);
    }
  };

  return (
    <FieldSet
      id={id}
      legend={<DinaMessage id="materialSampleInfo" />}
      componentName={MATERIAL_SAMPLE_INFO_COMPONENT_NAME}
      sectionName="material-sample-info-section"
      horizontal={INLINE_LABEL_WIDTH}
      compact={true}
    >
      <ControlledVocabularySelectField
        name="materialSampleType"
        query={() => ({
          path: "collection-api/vocabulary2/materialSampleType"
        })}
      />
      {!readOnly ? (
        <AutoSuggestTextField<Vocabulary>
          name="materialSampleState"
          jsonApiBackend={{
            query: () => ({
              path: "collection-api/vocabulary2/materialSampleState"
            }),
            option: (vocabElement) =>
              _.compact(
                vocabElement?.vocabularyElements?.map(
                  (it) =>
                    _.find(
                      it?.multilingualTitle?.titles || [],
                      (item) => item.lang === locale
                    )?.title ||
                    it.name ||
                    ""
                ) ?? []
              )
          }}
          blankSearchBackend={"json-api"}
          onChangeExternal={onMaterialSampleStateChanged}
        />
      ) : (
        <MaterialSampleStateReadOnlyRender removeLabel={false} />
      )}
      {!isTemplate && <SplitNamesStartFromField />}
      <TextField name="materialSampleRemarks" multiLines={true} />
      {!readOnly && (
        <FieldSpy fieldName="materialSampleState">
          {(materialSampleState) =>
            materialSampleState ? (
              <>
                <DateField
                  name="stateChangedOn"
                  label={formatMessage("date")}
                />
                <TextField
                  name="stateChangeRemarks"
                  multiLines={true}
                  label={formatMessage("additionalRemarks")}
                />
              </>
            ) : null
          }
        </FieldSpy>
      )}
    </FieldSet>
  );
}

/** Static example hierarchies for each option's info panel. Each depth level indents 22px. */
const SPLIT_EXAMPLES = {
  parent: [
    {
      id: "ABC-123",
      type: "splitExampleWholeOrganism",
      tag: "splitExampleBaseName",
      depth: 0,
      role: "base"
    },
    {
      id: "ABC-123-a",
      type: "splitExampleOrganismPart",
      tag: "splitExampleBeingSplit",
      depth: 1,
      role: "existing"
    },
    {
      id: "ABC-123-b",
      type: "splitExampleOrganismPart",
      tag: "splitExampleNew",
      depth: 2,
      role: "new"
    },
    {
      id: "ABC-123-c",
      type: "splitExampleOrganismPart",
      tag: "splitExampleNew",
      depth: 2,
      role: "new"
    }
  ],
  thisSample: [
    {
      id: "T-100",
      type: "splitExampleOrganismPart",
      tag: "splitExampleBaseNameBeingSplit",
      depth: 0,
      role: "base"
    },
    {
      id: "T-100-a",
      type: "splitExampleOrganismPart",
      tag: "splitExampleNew",
      depth: 1,
      role: "new"
    },
    {
      id: "T-100-b",
      type: "splitExampleOrganismPart",
      tag: "splitExampleNew",
      depth: 1,
      role: "new"
    }
  ]
} as const;

type InfoState = "closed" | "open" | "pinned";

/** Where split names start from: this sample (isBaseForSplitByType) or a parent of another type. */
function SplitNamesStartFromField() {
  const { formatMessage } = useDinaIntl();
  const options = [
    {
      value: false,
      label: formatMessage("splitNamesFromParent"),
      rule: formatMessage("splitNamesFromParentRule"),
      example: SPLIT_EXAMPLES.parent
    },
    {
      value: true,
      label: formatMessage("splitNamesFromThisSample"),
      rule: formatMessage("splitNamesFromThisSampleRule"),
      example: SPLIT_EXAMPLES.thisSample
    }
  ];

  // Kept here rather than in each panel so only one is open at a time.
  const [openInfo, setOpenInfo] = useState<{
    value: boolean;
    state: InfoState;
  }>({ value: false, state: "closed" });

  return (
    <FieldWrapper
      name="isBaseForSplitByType"
      className={styles.splitField}
      disableTemplateCheckbox={true}
      disableLabelClick={true}
      readOnlyRender={(value) =>
        options.find((option) => option.value === !!value)?.label
      }
    >
      {({ value, setValue }) => (
        <div
          className={styles.splitOptions}
          role="radiogroup"
          aria-label={formatMessage("field_isBaseForSplitByType")}
        >
          {options.map((option) => {
            const selected = !!value === option.value;
            return (
              <div key={String(option.value)} className={styles.optionRow}>
                <div
                  className={classNames(
                    styles.splitOption,
                    selected && styles.selected
                  )}
                  onClick={() => setValue(option.value)}
                >
                  <input
                    type="radio"
                    className="form-check-input mt-0"
                    name="isBaseForSplitByType-option"
                    checked={selected}
                    onChange={() => setValue(option.value)}
                    aria-label={option.label}
                  />
                  <span>{option.label}</span>
                </div>
                <SplitOptionInfo
                  {...option}
                  panelId={`split-option-info-${option.value}`}
                  state={
                    openInfo.value === option.value ? openInfo.state : "closed"
                  }
                  setState={(state) =>
                    // Closing another option's panel (e.g. Escape on this icon) leaves the open one alone.
                    setOpenInfo((current) =>
                      state === "closed" && current.value !== option.value
                        ? current
                        : { value: option.value, state }
                    )
                  }
                />
              </div>
            );
          })}
          <div className="small text-muted">
            {formatMessage("splitNamesStartFromHelp")}
          </div>
        </div>
      )}
    </FieldWrapper>
  );
}

interface SplitOptionInfoProps {
  label: string;
  rule: string;
  example: (typeof SPLIT_EXAMPLES)[keyof typeof SPLIT_EXAMPLES];
  panelId: string;
  state: InfoState;
  setState: (next: InfoState) => void;
}

/**
 * Info icon beside a split option. Hover or focus opens its panel and a click pins it open.
 * It sits outside the option card, so it never changes the selection.
 */
function SplitOptionInfo({
  label,
  rule,
  example,
  panelId,
  state,
  setState
}: SplitOptionInfoProps) {
  const { formatMessage } = useDinaIntl();
  const open = () => state === "closed" && setState("open");
  const closeUnlessPinned = () => state === "open" && setState("closed");

  return (
    // Wraps the panel too, so moving the pointer onto the panel keeps it open.
    <span onMouseEnter={open} onMouseLeave={closeUnlessPinned}>
      <button
        type="button"
        className={styles.infoButton}
        aria-label={formatMessage("splitOptionInfo", { option: label })}
        aria-expanded={state !== "closed"}
        aria-controls={panelId}
        onFocus={open}
        onBlur={closeUnlessPinned}
        onClick={() => setState(state === "pinned" ? "closed" : "pinned")}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setState("closed");
          }
        }}
      >
        <FaCircleInfo size={15} />
      </button>
      {state !== "closed" && (
        <div id={panelId} role="tooltip" className={styles.infoPanel}>
          <strong>{label}</strong>
          <div className={styles.infoRule}>{rule}</div>
          <div className={styles.diagram}>
            {example.map((row) => (
              <div
                key={row.id}
                className={classNames(styles.diagramRow, styles[row.role])}
                style={{ marginLeft: row.depth * 22 }}
              >
                <span className={styles.rowId}>{row.id}</span>
                <span className={styles.rowType}>
                  {formatMessage(row.type)}
                </span>
                <span className={styles.pill}>{formatMessage(row.tag)}</span>
              </div>
            ))}
          </div>
          <div className={styles.infoFooter}>
            {formatMessage("splitExampleFooter")}
          </div>
        </div>
      )}
    </span>
  );
}

export function MaterialSampleInfoManagedAttributes({
  id,
  visibleManagedAttributeKeys
}: {
  id?: string;
  visibleManagedAttributeKeys?: VisibleManagedAttributesConfig;
}) {
  const { readOnly } = useDinaFormContext();

  if (!readOnly) {
    return null;
  }

  return (
    <DinaFormSection
      componentName={MANAGED_ATTRIBUTES_COMPONENT_NAME}
      sectionName="managed-attributes-section"
    >
      <div className="row">
        <div className="col-md-12">
          <ManagedAttributesEditor
            valuesPath="managedAttributes"
            managedAttributeApiPath="collection-api/controlled-vocabulary-item"
            managedAttributeComponent="MATERIAL_SAMPLE"
            fieldSetProps={{
              id,
              legend: <DinaMessage id="materialSampleManagedAttributes" />
            }}
            managedAttributeOrderFieldName="managedAttributesOrder"
            visibleAttributeKeys={visibleManagedAttributeKeys?.materialSample}
            disableClearButton={true}
            isControlledVocabulary={true}
          />
        </div>
      </div>
    </DinaFormSection>
  );
}
