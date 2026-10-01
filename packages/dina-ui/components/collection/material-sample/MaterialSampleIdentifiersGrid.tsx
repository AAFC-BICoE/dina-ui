import {
  CheckBoxField,
  DinaFormSection,
  FieldSet,
  TextField,
  useDinaFormContext
} from "common-ui";
import { useField } from "formik";
import { useState } from "react";
import { FaBoxArchive, FaClipboardList, FaTag, FaUsers } from "react-icons/fa6";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { IDENTIFIER_COMPONENT_NAME } from "../../../types/collection-api";
import { AssemblageSelectField } from "../../assemblage/AssemblageSelectSection";
import { GroupSelectField } from "../../group-select/GroupSelectField";
import { ProjectsSelectField } from "../../project/ProjectSelectSection";
import { NotPubliclyReleasableSection } from "../../tag-editor/NotPubliclyReleasableSection";
import { TagSelectField } from "../../tag-editor/TagSelectField";
import { COLLECTION_OTHER_IDENTIFIERS_ID } from "../../controlled-vocabulary/controlledVocabularyItemUtils";
import { CollectionSelectField } from "../CollectionSelectSection";
import { OtherIdentifiersSection } from "../OtherIdentifiersSection";
import { ParentSelectField } from "../ParentSelectSection";

export interface MaterialSampleIdentifiersGridProps {
  id?: string;
  disableSampleNameField?: boolean;
  hideUseSequence?: boolean;
  enableStoredDefaultGroup?: boolean;
  enableCollectingEvent?: boolean;
  defaultToNotReleasable?: boolean;
}

/**
 * The Identifiers data component of the material sample form: four panels in a 2:1 grid.
 * Field names, sections and components are unchanged from the previous layout so form templates still apply.
 */
export function MaterialSampleIdentifiersGrid({
  id = IDENTIFIER_COMPONENT_NAME,
  disableSampleNameField,
  hideUseSequence,
  enableStoredDefaultGroup,
  enableCollectingEvent,
  defaultToNotReleasable
}: MaterialSampleIdentifiersGridProps) {
  const [{ value: collection }] = useField("collection");
  const { readOnly, initialValues } = useDinaFormContext();
  const [primaryIdDisabled, setPrimaryIdDisabled] = useState(false);

  return (
    <div id={id} className="identifiers-grid">
      <FieldSet
        id="identifiers-main"
        legend={<DinaMessage id="identifiers" />}
        className="non-strip"
        componentName={IDENTIFIER_COMPONENT_NAME}
        sectionName="identifiers-section"
      >
        <div className="identifiers-panel-grid">
          <div className="d-flex flex-column gap-1">
            <TextField
              disableTemplateCheckbox={true}
              name="materialSampleName"
              inputProps={{ disabled: primaryIdDisabled }}
              customName="materialSampleName"
              className="materialSampleName"
              readOnly={disableSampleNameField}
              removeBottomMargin={true}
            />
            {!readOnly && !hideUseSequence && (
              <DinaFormSection horizontal="flex">
                <CheckBoxField
                  onCheckBoxClick={(event) =>
                    setPrimaryIdDisabled(event.target.checked)
                  }
                  name="useNextSequence"
                  className="use-next-sequence"
                  removeBottomMargin={true}
                  // only enabled when add new sample and collection is selected
                  disabled={initialValues.id || !collection?.id}
                  overridecheckboxProps={{
                    style: { display: "block", height: "16px", width: "16px" }
                  }}
                />
              </DinaFormSection>
            )}
          </div>
          <TextField
            name="barcode"
            customName="barcode"
            removeBottomMargin={true}
          />
          <OtherIdentifiersSection
            compact={true}
            controlledVocabularyUuid={COLLECTION_OTHER_IDENTIFIERS_ID}
            dinaComponent="MATERIAL_SAMPLE"
            resourceLabelKey="material-sample"
            templateCheckboxPrefix={IDENTIFIER_COMPONENT_NAME}
          />
        </div>
      </FieldSet>

      <FieldSet
        id="identifiers-ownership"
        legend={<DinaMessage id="ownership" />}
        className="non-strip"
        componentName={IDENTIFIER_COMPONENT_NAME}
        sectionName="general-section"
      >
        <div className="identifiers-panel-stack">
          <GroupSelectField
            disableTemplateCheckbox={true}
            name="group"
            enableStoredDefaultGroup={enableStoredDefaultGroup}
            hideWithOnlyOneGroup={false}
            removeBottomMargin={true}
            label={
              <span>
                <FaUsers className="me-1" /> <DinaMessage id="group" />
              </span>
            }
          />
          <CollectionSelectField
            resourcePath="collection-api/collection"
            horizontal={false}
            icon={<FaBoxArchive className="me-1" />}
            className="mb-0"
          />
        </div>
      </FieldSet>

      <FieldSet
        id="identifiers-relationships"
        legend={<DinaMessage id="relationshipsAndTags" />}
        className="non-strip"
        componentName={IDENTIFIER_COMPONENT_NAME}
        sectionName="general-section"
      >
        <div className="identifiers-panel-grid">
          <ParentSelectField
            enableCollectingEvent={enableCollectingEvent}
            horizontal={false}
            className="mb-0"
          />
          <ProjectsSelectField
            resourcePath="collection-api/project"
            horizontal={false}
            icon={<FaClipboardList className="me-1" />}
            className="mb-0"
          />
          <AssemblageSelectField
            resourcePath="collection-api/assemblage"
            horizontal={false}
            className="mb-0"
          />
          <DinaFormSection horizontal={false}>
            <TagSelectField
              indexName="dina_material_sample_index"
              resourcePath="collection-api/material-sample"
              className="tags"
              name="tags"
              groupSelectorName="group"
              tagsFieldName="tags"
              removeBottomMargin={true}
              label={
                <span>
                  <FaTag className="me-1" /> <DinaMessage id="tags" />
                </span>
              }
            />
          </DinaFormSection>
        </div>
      </FieldSet>

      <FieldSet
        id="identifiers-releasable"
        legend={<DinaMessage id="publiclyReleasable" />}
        className="non-strip"
        componentName={IDENTIFIER_COMPONENT_NAME}
        sectionName="general-section"
      >
        <NotPubliclyReleasableSection
          defaultToNotReleasable={defaultToNotReleasable}
          singleLineReason={true}
        />
      </FieldSet>
    </div>
  );
}
