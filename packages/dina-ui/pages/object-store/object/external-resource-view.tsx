import {
  BackToListButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  LoadingSpinner,
  UploadDerivativeButton,
  CustomQueryPageView,
  generateUUIDTree
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMetadataViewQuery } from "../../../components/object-store/metadata/useMetadata";
import { Footer, Head, Nav, TagSelectReadOnly } from "../../../components";
import {
  MetadataDetails,
  CollapsableSection
} from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MetadataFileView } from "../../../components/object-store/metadata/MetadataFileView";
import { useMaterialSampleRelationshipColumns } from "../../../components/collection/material-sample/useMaterialSampleRelationshipColumns";
import { useMemo } from "react";

export default function ExternalResourceMetadataViewPage() {
  const { ELASTIC_SEARCH_COLUMN } = useMaterialSampleRelationshipColumns();
  const router = useRouter();

  const id = String(router.query.id);

  const { loading, response } = useMetadataViewQuery(id);
  const metadata = response?.data;

  const fileName = useMemo(
    () => response?.data?.filename ?? response?.data?.originalFilename,
    [response]
  );

  const { formatMessage } = useDinaIntl();

  const customViewQuery = metadata?.id
    ? generateUUIDTree(metadata?.id, "data.relationships.attachment.data.id")
    : undefined;

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (response) {
    const metadata = response.data;

    const buttonBar = (
      <ButtonBar className="mb-3">
        <div className="col-md-3">
          <BackToListButton entityLink="/object-store/object" />
        </div>
        <div className="col-md-9 flex d-flex gap-2">
          <Link
            href={`/object-store/metadata/external-resource-edit?id=${id}`}
            className="btn btn-primary ms-auto"
            style={{ width: "10rem" }}
          >
            <DinaMessage id="editButtonText" />
          </Link>
          <UploadDerivativeButton acDerivedFrom={id} />
          <Link
            href={`/object-store/metadata/revisions?id=${id}&isExternalResourceMetadata=true`}
            className="btn btn-info"
          >
            <DinaMessage id="revisionsButtonText" />
          </Link>
          <DeleteButton
            className="ms-5"
            id={id}
            options={{ apiBaseUrl: "/objectstore-api" }}
            postDeleteRedirect="/object-store/object/list"
            type="metadata"
          />
        </div>
      </ButtonBar>
    );

    return (
      <div>
        <Head title={fileName} />
        <Nav marginBottom={false} />
        {buttonBar}
        <main className="container-fluid">
          <DinaForm initialValues={metadata} readOnly={true}>
            {metadata.derivatives && (
              <MetadataFileView metadata={metadata} imgHeight="15rem" />
            )}
            <TagSelectReadOnly tagsFieldName="acTags" />
            <MetadataDetails metadata={metadata} />
            {customViewQuery && (
              <CollapsableSection
                collapserId={metadata?.id ?? ""}
                title={formatMessage("attachedMaterialSamples")}
                key={metadata?.id ?? ""}
              >
                <CustomQueryPageView
                  uniqueName="attached-material-samples-external-resource"
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
                            fieldName: "data.relationships.attachment.data.id",
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
        </main>
        <Footer />
      </div>
    );
  }

  return null;
}
