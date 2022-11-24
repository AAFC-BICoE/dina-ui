import {
  DateField,
  FieldSet,
  generateUUIDTree,
  QueryPage,
  TextField,
  useDinaFormContext
} from "common-ui";
import { AttachmentsField, GroupSelectField } from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { useRouter } from "next/router";
import { ELASTIC_SEARCH_COLUMN } from "../material-sample/RelationshipColumns";

export function ProjectFormLayout() {
  const { readOnly, initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  const router = useRouter();
  const uuid = String(router?.query?.id);
  const customViewQuery = generateUUIDTree(
    uuid,
    "data.relationships.projects.data.id"
  );

  return (
    <div>
      <div className="row">
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <div className="row">
        <TextField
          className="col-md-6 name"
          name="name"
          label={formatMessage("field_projectName")}
        />
        <DateField
          className="col-md-6 startDate"
          name="startDate"
          label={formatMessage("field_startDate")}
        />
      </div>
      <div className="row">
        <TextField
          className="col-md-6 status"
          name="status"
          label={formatMessage("field_projectStatus")}
        />
        <DateField
          className="col-md-6 endDate"
          name="endDate"
          label={formatMessage("field_endDate")}
        />
      </div>
      <div className="row">
        <TextField
          className="col-md-6 english-description"
          name="multilingualDescription.en"
          label={formatMessage("field_description.en")}
          multiLines={true}
        />
        <TextField
          className="col-md-6 french-description"
          name="multilingualDescription.fr"
          label={formatMessage("field_description.fr")}
          multiLines={true}
        />
      </div>
      <AttachmentsField
        name="attachment"
        title={<DinaMessage id="projectAttachments" />}
        id="project-attachments-section"
        allowNewFieldName="attachmentsConfig.allowNew"
        allowExistingFieldName="attachmentsConfig.allowExisting"
        attachmentPath={`collection-api/project/${initialValues?.id}/attachment`}
        hideAddAttchmentBtn={true}
      />

      {readOnly && (
        <FieldSet legend={<DinaMessage id="attachedMaterialSamples" />}>
          <QueryPage
            columns={ELASTIC_SEARCH_COLUMN}
            indexName={"dina_material_sample_index"}
            viewMode={readOnly}
            customViewQuery={readOnly ? customViewQuery : undefined}
            customViewFields={
              readOnly ? ["data.relationships.projects.data.id"] : undefined
            }
          />
        </FieldSet>
      )}
    </div>
  );
}
