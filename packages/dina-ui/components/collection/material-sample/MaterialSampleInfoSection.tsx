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
import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";
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

/** One sample in an info panel's example hierarchy. */
interface SplitExampleRow {
  id: string;
  type: keyof typeof DINAUI_MESSAGES_ENGLISH;
  tag: keyof typeof DINAUI_MESSAGES_ENGLISH;
  /** Indent level; each level indents 22px. */
  depth: number;
  role?: "base" | "new" | "skipped";
  /** Set on rows the search checked, in the order it checked them. */
  step?: number;
  check?: { settingOn: boolean; typeDifferent: boolean };
}

const SPLIT_EXAMPLES: Record<"parent" | "thisSample", SplitExampleRow[]> = {
  parent: [
    {
      id: "ABC-123",
      type: "splitExampleWholeOrganism",
      tag: "splitExampleBaseName",
      depth: 0,
      role: "base",
      step: 2,
      check: { settingOn: false, typeDifferent: true }
    },
    {
      id: "ABC-123-a",
      type: "splitExampleOrganismPart",
      tag: "splitExampleChecked",
      depth: 1,
      step: 1,
      check: { settingOn: false, typeDifferent: false }
    },
    {
      id: "ABC-123-b",
      type: "splitExampleOrganismPart",
      tag: "splitExampleBeingSplit",
      depth: 2
    },
    {
      id: "ABC-123-c",
      type: "splitExampleOrganismPart",
      tag: "splitExampleNew",
      depth: 3,
      role: "new"
    },
    {
      id: "ABC-123-d",
      type: "splitExampleOrganismPart",
      tag: "splitExampleNew",
      depth: 3,
      role: "new"
    }
  ],
  thisSample: [
    {
      id: "ABC-123",
      type: "splitExampleWholeOrganism",
      tag: "splitExampleNotChecked",
      depth: 0,
      role: "skipped"
    },
    {
      id: "T-100",
      type: "splitExampleOrganismPart",
      tag: "splitExampleBaseName",
      depth: 1,
      role: "base",
      step: 1,
      check: { settingOn: true, typeDifferent: false }
    },
    {
      id: "T-100-a",
      type: "splitExampleOrganismPart",
      tag: "splitExampleBeingSplit",
      depth: 2
    },
    {
      id: "T-100-b",
      type: "splitExampleOrganismPart",
      tag: "splitExampleNew",
      depth: 3,
      role: "new"
    },
    {
      id: "T-100-c",
      type: "splitExampleOrganismPart",
      tag: "splitExampleNew",
      depth: 3,
      role: "new"
    }
  ]
};

/** Where split names start from: this sample (isBaseForSplitByType) or a parent of another type. */
function SplitNamesStartFromField() {
  const { formatMessage } = useDinaIntl();
  const options = [
    {
      value: false,
      label: formatMessage("splitNamesFromParent"),
      description: formatMessage("splitNamesFromParentDescription"),
      rule: formatMessage("splitNamesFromParentRule"),
      example: SPLIT_EXAMPLES.parent
    },
    {
      value: true,
      label: formatMessage("splitNamesFromThisSample"),
      description: formatMessage("splitNamesFromThisSampleDescription"),
      rule: formatMessage("splitNamesFromThisSampleRule"),
      example: SPLIT_EXAMPLES.thisSample
    }
  ];

  // The option whose info panel is showing, so only one shows at a time.
  const [infoFor, setInfoFor] = useState<boolean | null>(null);

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
          {options.map((option, index) => {
            const selected = !!value === option.value;
            const panelId = `split-option-info-${option.value}`;
            const descriptionId = `split-option-description-${option.value}`;
            const showInfo = () => setInfoFor(option.value);
            const hideInfo = () =>
              setInfoFor((current) =>
                current === option.value ? null : current
              );
            return (
              // Hovering or focusing an option, or its panel, shows what it means.
              <div
                key={String(option.value)}
                className={styles.optionRow}
                onMouseEnter={showInfo}
                onMouseLeave={hideInfo}
                onFocus={showInfo}
                onBlur={hideInfo}
                onKeyDown={(event) =>
                  event.key === "Escape" && setInfoFor(null)
                }
              >
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
                    aria-describedby={`${descriptionId} ${panelId}`}
                  />
                  <span>
                    {option.label}
                    <span
                      id={descriptionId}
                      className="d-block small text-muted fw-normal"
                    >
                      {option.description}
                    </span>
                  </span>
                </div>
                <SplitOptionInfoPanel
                  {...option}
                  id={panelId}
                  hidden={infoFor !== option.value}
                  // The right-hand option's panel lines up with its right edge to stay on the page.
                  alignEnd={index === 1}
                />
              </div>
            );
          })}
          <div className={classNames("small text-muted", styles.splitHelp)}>
            {formatMessage("splitNamesStartFromHelp")}
          </div>
        </div>
      )}
    </FieldWrapper>
  );
}

interface SplitOptionInfoPanelProps {
  id: string;
  label: string;
  rule: string;
  example: SplitExampleRow[];
  hidden: boolean;
  alignEnd: boolean;
}

/**
 * Explains a split option with an example hierarchy. It stays in the page while hidden so
 * the option's aria-describedby can still read it.
 */
function SplitOptionInfoPanel({
  id,
  label,
  rule,
  example,
  hidden,
  alignEnd
}: SplitOptionInfoPanelProps) {
  const { formatMessage } = useDinaIntl();

  return (
    <div
      id={id}
      role="tooltip"
      hidden={hidden}
      className={classNames(styles.infoPanel, alignEnd && styles.alignEnd)}
    >
      <strong>{label}</strong>
      <div className={styles.infoRule}>{rule}</div>
      <div>
        <div className="small fw-bold text-muted mb-1">
          {formatMessage("splitHowBaseIsFound")}
        </div>
        <ol className="small mb-0 ps-3">
          <li>{formatMessage("splitHowBaseIsFoundStep1")}</li>
          <li>{formatMessage("splitHowBaseIsFoundStep2")}</li>
          <li>{formatMessage("splitHowBaseIsFoundStep3")}</li>
        </ol>
      </div>
      <div className={styles.diagram}>
        {example.map(({ id, type, tag, depth, role, step, check }) => (
          <div
            key={id}
            className={classNames(styles.diagramRow, role && styles[role])}
            style={{ marginLeft: depth * 22 }}
          >
            {step && <span className={styles.stepCircle}>{step}</span>}
            <span className={styles.rowId}>{id}</span>
            <span className={styles.rowType}>{formatMessage(type)}</span>
            <span className={styles.pill}>{formatMessage(tag)}</span>
            {check && (
              // Either condition stops the search, so a true condition is filled; its text says so too.
              <div className={styles.checkLine}>
                <span
                  className={classNames(
                    styles.conditionPill,
                    check.settingOn && styles.causedStop
                  )}
                >
                  {formatMessage(
                    check.settingOn
                      ? "splitExampleSettingOn"
                      : "splitExampleSettingOff"
                  )}
                </span>
                <span
                  className={classNames(
                    styles.conditionPill,
                    check.typeDifferent && styles.causedStop
                  )}
                >
                  {formatMessage(
                    check.typeDifferent
                      ? "splitExampleTypeDifferent"
                      : "splitExampleTypeSame"
                  )}
                </span>
                <span className="text-muted">
                  <span aria-hidden="true">→ </span>
                  {formatMessage(
                    check.settingOn || check.typeDifferent
                      ? "splitExampleStop"
                      : "splitExampleKeepGoing"
                  )}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.infoFooter}>
        {formatMessage("splitExampleFooter")}
      </div>
    </div>
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
