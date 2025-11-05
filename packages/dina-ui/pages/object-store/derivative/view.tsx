import {
  BackButton,
  ButtonBar,
  DinaForm,
  LoadingSpinner,
  withResponse
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDerivativeMetadataViewQuery } from "../../../components/object-store/metadata/useMetadata";
import {
  Footer,
  Head,
  Nav,
  NotPubliclyReleasableWarning,
  TagSelectReadOnly,
  TagsAndRestrictionsSection
} from "../../../components";
import { MetadataFileView } from "../../../components/object-store/metadata/MetadataFileView";
import { DerivativeDetails } from "../../../components/object-store/derivative/DerivativeDetails";
import { Metadata } from "../../../types/objectstore-api";
import { derivativeTypeToLabel } from "../../../components/object-store";
import { useDinaIntl, DinaMessage } from "../../../intl/dina-ui-intl";
import { useMemo } from "react";

const OBJECT_DETAILS_PAGE_CSS = `
  .file-viewer-wrapper img {
    max-width: 100%;
    height: auto;
  }
`;

export default function DerivativeViewPage() {
  const router = useRouter();
  const uuid = String(router.query.id);
  const { messages } = useDinaIntl();
  const derivativeQuery = useDerivativeMetadataViewQuery(uuid);
  const fileName = useMemo(
    () =>
      derivativeQuery?.response?.data?.filename ??
      derivativeQuery?.response?.data?.objectUpload?.originalFilename,
    [derivativeQuery]
  );

  if (derivativeQuery?.loading || derivativeQuery?.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const derivative = derivativeQuery.response?.data;

  const parentFileName = (derivative?.acDerivedFrom as Metadata)
    ?.originalFilename;

  const headTitle =
    derivative?.objectUpload?.originalFilename ||
    `${parentFileName} ${derivativeTypeToLabel(
      derivative?.derivativeType ?? "",
      messages
    )}`;

  // Check the request to see if a permission provider is present.
  const permissionsProvided =
    derivativeQuery?.response?.data?.meta?.permissionsProvider;

  const canEdit = permissionsProvided
    ? derivativeQuery?.response?.data?.meta?.permissions?.includes("update") ??
      false
    : true;

  const buttonBar = (
    <ButtonBar className="mb-3">
      <div className="col-md-8 mt-2">
        <BackButton
          entityLink="/object-store/object/"
          entityId={`${derivative?.acDerivedFrom?.id}`}
          buttonMsg="backToParentFile"
          buttonMsgValues={{ parentFilename: parentFileName }}
        />
      </div>
      <div className="col-md-4 flex d-flex gap-2">
        {canEdit && (
          <>
            <Link
              href={`/object-store/derivative/edit?id=${uuid}`}
              className="btn btn-primary ms-auto"
              style={{ width: "5rem" }}
            >
              <DinaMessage id="editButtonText" />
            </Link>
          </>
        )}
      </div>
    </ButtonBar>
  );

  return (
    <div>
      <Head title={headTitle} />
      <Nav marginBottom={false} />
      <style>{OBJECT_DETAILS_PAGE_CSS}</style>
      {buttonBar}
      <main className="container-fluid">
        {withResponse(derivativeQuery, (_) => {
          return (
            <div className="row mt-3">
              <div className="col-md-4">
                <MetadataFileView
                  metadata={derivative as any}
                  hideDownload={false}
                />
              </div>
              <div className="col-md-8">
                <DinaForm initialValues={derivative as any} readOnly={true}>
                  <div className="row d-flex">
                    <div className="col-md-12">
                      <h1
                        style={{ marginTop: 0 }}
                        className="d-inline-flex flex-row w-100"
                      >
                        {fileName}
                        <div className="ms-auto">
                          <NotPubliclyReleasableWarning />
                        </div>
                      </h1>
                      <TagSelectReadOnly tagsFieldName="acTags" />
                      <TagsAndRestrictionsSection
                        tagsFieldName="acTags"
                        groupSelectorName="bucket"
                      />
                    </div>
                  </div>
                  <DerivativeDetails derivative={derivative as any} />
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
