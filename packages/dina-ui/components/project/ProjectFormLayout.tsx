import {
  DateField,
  FieldSet,
  QueryPage,
  TextField,
  useDinaFormContext
} from "common-ui";
import { TableColumn } from "../../../common-ui/lib/list-page/types";
import { Project } from "../../../dina-ui/types/collection-api";
import { AttachmentsField, GroupSelectField } from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { useAccount } from "common-ui";
import { useRouter } from "next/router";
import { TransformQueryToDSLParams } from "../../../common-ui/lib/util/transformToDSL";

export function ProjectFormLayout() {
  const { readOnly, initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  const router = useRouter();
  const uuid = String(router?.query?.id);
  const customViewQuery: TransformQueryToDSLParams | undefined = readOnly
    ? {
        queryRows: [
          {
            fieldName: "data.relationships.projects.data.id",
            type: "uuid",
            matchValue: uuid
          }
        ]
      }
    : undefined;

  // Columns for the elastic search list page.
  const columns: TableColumn<Project>[] = [
    // Material Sample Name
    {
      Cell: ({ original: { id, data } }) => (
        <a href={`/collection/material-sample/view?id=${id}`}>
          {data?.attributes?.materialSampleName ||
            data?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
            id}
        </a>
      ),
      label: "materialSampleName",
      accessor: "data.attributes.materialSampleName",
      isKeyword: true
    }
  ];

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
            columns={columns}
            indexName={"dina_material_sample_index"}
            viewMode={readOnly}
            customViewQuery={customViewQuery}
          />
        </FieldSet>
      )}
    </div>
  );
}
