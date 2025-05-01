import {
  ButtonBar,
  DeleteButton,
  DinaForm,
  LoadingSpinner,
  generateUUIDTree,
  BackButton,
  CustomQueryPageView,
  UploadDerivativeButton,
  withResponse
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMetadataViewQuery } from "../../../components/object-store/metadata/useMetadata";
import {
  Footer,
  Head,
  Nav,
  NotPubliclyReleasableWarning,
  TagSelectReadOnly,
  TagsAndRestrictionsSection
} from "../../../components";
import {
  CollapsableSection,
  ExifView,
  MetadataDetails
} from "../../../components/object-store";
import { MetadataFileView } from "../../../components/object-store/metadata/MetadataFileView";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { useMaterialSampleRelationshipColumns } from "../../../components/collection/material-sample/useMaterialSampleRelationshipColumns";

const OBJECT_DETAILS_PAGE_CSS = `
  .file-viewer-wrapper img {
    max-width: 100%;
    height: auto;
  }
`;

export default function MetadataViewPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const { ELASTIC_SEARCH_COLUMN } = useMaterialSampleRelationshipColumns();
  const uuid = String(router.query.id);
  const query = useMetadataViewQuery(uuid);
  if (query?.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const metadata = query?.response?.data;
  const customViewQuery = metadata?.id
    ? generateUUIDTree(metadata?.id, "data.relationships.attachment.data.id")
    : undefined;

  // Check the request to see if a permission provider is present.
  const permissionsProvided = metadata?.meta?.permissionsProvider;

  const canEdit = permissionsProvided
    ? metadata?.meta?.permissions?.includes("update") ?? false
    : true;
  const canDelete = permissionsProvided
    ? metadata?.meta?.permissions?.includes("delete") ?? false
    : true;

  const buttonBar = (
    <ButtonBar>
      <div className="col-md-4 mt-2">
        <BackButton
          byPassView={true}
          className="me-auto"
          entityId={uuid}
          entityLink="/object-store/object"
        />
      </div>
      <div className="col-md-8 flex d-flex gap-2">
        {canEdit && (
          <>
            <Link href={`/object-store/metadata/edit?id=${uuid}`}>
              <a className="btn btn-primary ms-auto" style={{ width: "10rem" }}>
                <DinaMessage id="editButtonText" />
              </a>
            </Link>
            <UploadDerivativeButton acDerivedFrom={uuid} />
          </>
        )}
        <Link href={`/object-store/metadata/revisions?id=${uuid}`}>
          <a className="btn btn-info">
            <DinaMessage id="revisionsButtonText" />
          </a>
        </Link>
        {canDelete && (
          <DeleteButton
            className="ms-3"
            id={uuid}
            options={{ apiBaseUrl: "/objectstore-api" }}
            postDeleteRedirect="/object-store/object/list"
            type="metadata"
          />
        )}
      </div>
    </ButtonBar>
  );

  return (
    <div>
      <Head title={metadata?.originalFilename} />
      <Nav marginBottom={false} />
      <style>{OBJECT_DETAILS_PAGE_CSS}</style>
      {buttonBar}
      <main className="container-fluid">
        {withResponse(query, (response) => {
          return (
            <div className="row mt-3">
              <div className="col-md-4">
                <MetadataFileView metadata={response.data} preview={false} />
              </div>
              <div className="col-md-8">
                <DinaForm initialValues={response.data} readOnly={true}>
                  <TagSelectReadOnly tagsFieldName="acTags" />
                  <NotPubliclyReleasableWarning />
                  <TagsAndRestrictionsSection
                    tagsFieldName="acTags"
                    groupSelectorName="bucket"
                  />
                  <MetadataDetails metadata={response.data} />
                  <ExifView objectUpload={response.data.objectUpload} />
                  {customViewQuery && (
                    <CollapsableSection
                      collapserId={metadata?.id ?? ""}
                      title={formatMessage("attachedMaterialSamples")}
                      key={metadata?.id ?? ""}
                    >
                      <CustomQueryPageView
                        uniqueName="attached-material-samples-object-store"
                        columns={ELASTIC_SEARCH_COLUMN}
                        indexName={"dina_material_sample_index"}
                        viewMode={customViewQuery ? true : false}
                        removePadding={true}
                        customViewQuery={customViewQuery ?? undefined}
                        customViewFilterGroups={false}
                        customViewFields={
                          customViewQuery
                            ? [
                                {
                                  fieldName:
                                    "data.relationships.attachment.data.id",
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
                    </CollapsableSection>
                  )}
                </DinaForm>
              </div>
            </div>
          );
        })}
      </main>
      <Footer />
    </div>
  );
}
