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
  TagsAndRestrictionsSection
} from "../../../components";
import { ExifView, MetadataDetails } from "../../../components/object-store";
import { MetadataFileView } from "../../../components/object-store/metadata/MetadataFileView";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { useMaterialSampleRelationshipColumns } from "../../../components/collection/material-sample/useMaterialSampleRelationshipColumns";

const OBJECT_DETAILS_PAGE_CSS = `
  .file-viewer-wrapper img {
    max-width: 100%;
    height: auto;
  }
`;

export default function MetadataViewPage() {
  const router = useRouter();
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
      <BackButton
        byPassView={true}
        className="me-auto"
        entityId={uuid}
        entityLink="/object-store/object"
      />
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
          className="ms-5"
          id={uuid}
          options={{ apiBaseUrl: "/objectstore-api" }}
          postDeleteRedirect="/object-store/object/list"
          type="metadata"
        />
      )}
    </ButtonBar>
  );

  return (
    <div>
      <Head title={metadata?.originalFilename} />
      <Nav />
      <style>{OBJECT_DETAILS_PAGE_CSS}</style>
      <main className="container-fluid">
        {buttonBar}
        {withResponse(query, (response) => {
          return (
            <div className="row">
              <div className="col-md-4">
                <MetadataFileView metadata={response.data} preview={false} />
              </div>
              <div className="col-md-8">
                <div className="container">
                  <DinaForm initialValues={response.data} readOnly={true}>
                    <NotPubliclyReleasableWarning />
                    <TagsAndRestrictionsSection
                      tagsFieldName="acTags"
                      groupSelectorName="bucket"
                    />
                    <MetadataDetails metadata={response.data} />
                    <ExifView objectUpload={response.data.objectUpload} />
                    {customViewQuery && (
                      <CustomQueryPageView
                        titleKey="attachedMaterialSamples"
                        uniqueName="attached-material-samples-object-store"
                        columns={ELASTIC_SEARCH_COLUMN}
                        indexName={"dina_material_sample_index"}
                        viewMode={customViewQuery ? true : false}
                        customViewQuery={customViewQuery ?? undefined}
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
                    )}
                  </DinaForm>
                </div>
              </div>
            </div>
          );
        })}
        {buttonBar}
      </main>
      <Footer />
    </div>
  );
}
