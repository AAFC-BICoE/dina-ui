import {
  CustomQueryPageView,
  DataEntryField,
  DateField,
  generateUUIDTree,
  MultilingualDescription,
  TextField,
  useDinaFormContext
} from "common-ui";
import { AttachmentsField, GroupSelectField } from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { useRouter } from "next/router";
import { useMaterialSampleRelationshipColumns } from "../collection/material-sample/useMaterialSampleRelationshipColumns";
import { AgentRolesField } from "../collection/AgentRolesField";
import { generateSearchURLFromSimpleRows } from "packages/common-ui/lib/list-page/query-url/queryUtils";

export function ProjectFormLayout() {
  const { readOnly, initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const router = useRouter();
  const uuid = String(router?.query?.id);
  const customViewQuery = generateUUIDTree(
    uuid,
    "data.relationships.projects.data.id"
  );
  const { ELASTIC_SEARCH_COLUMN } = useMaterialSampleRelationshipColumns();

  const relationshipPresenceUUIDSearch = generateSearchURLFromSimpleRows([
    {
      f: "_relationshipPresence",
      o: "uuid",
      v: "projects",
      t: "relationshipPresence",
      d: uuid ?? ""
    }
  ]);

  const linkObject = {
    pathname: `/collection/material-sample/list`,
    query: {
      queryTree: relationshipPresenceUUIDSearch
    }
  };

  return (
    <div>
      <div className="row">
        <TextField
          className="col-md-6 status"
          name="status"
          label={formatMessage("field_projectStatus")}
        />
      </div>
      <div className="row">
        <TextField
          className="col-md-6 name"
          name="name"
          label={formatMessage("field_projectName")}
        />
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        )}
      </div>
      <div className="row">
        <DateField
          className="col-md-6 startDate"
          name="startDate"
          label={formatMessage("field_startDate")}
        />
        <DateField
          className="col-md-6 endDate"
          name="endDate"
          label={formatMessage("field_endDate")}
        />
      </div>
      <MultilingualDescription />
      <DataEntryField
        legend={<DinaMessage id="projectFieldExtensions" />}
        name="extensionValues"
        readOnly={readOnly}
        blockOptionsEndpoint={`collection-api/extension`}
        blockOptionsFilter={{
          "extension.fields.dinaComponent": "PROJECT"
        }}
        width={"100%"}
      />
      <AttachmentsField
        name="attachment"
        title={<DinaMessage id="projectAttachments" />}
        id="project-attachments-section"
        allowNewFieldName="attachmentsConfig.allowNew"
        allowExistingFieldName="attachmentsConfig.allowExisting"
        attachmentPath={`collection-api/project/${initialValues?.id}/attachment`}
        hideAddAttchmentBtn={true}
      />
      <AgentRolesField
        fieldName="contributors"
        readOnly={readOnly}
        resourcePath="collection-api/project"
        forContributor={true}
        title={<DinaMessage id="contributors" />}
      />

      {readOnly && (
        <CustomQueryPageView
          titleKey="attachedMaterialSamples"
          uniqueName="attached-material-samples-project"
          columns={ELASTIC_SEARCH_COLUMN}
          indexName={"dina_material_sample_index"}
          viewMode={readOnly}
          linkObject={linkObject}
          linkMessageId="viewAttachedMaterialSamples"
          customViewQuery={readOnly ? customViewQuery : undefined}
          customViewFields={
            readOnly
              ? [
                  {
                    fieldName: "data.relationships.projects.data.id",
                    type: "uuid"
                  }
                ]
              : undefined
          }
          reactTableProps={{
            enableSorting: true,
            enableMultiSort: true
          }}
        />
      )}
    </div>
  );
}
