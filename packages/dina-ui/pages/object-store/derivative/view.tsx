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
  if (derivativeQuery?.loading || derivativeQuery?.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const derivative = derivativeQuery.response?.data;

  const parentFileName = (derivative?.acDerivedFrom as Metadata)
    ?.originalFilename;

  const fileName =
    derivative?.objectUpload?.originalFilename ||
    `${parentFileName} ${derivativeTypeToLabel(
      derivative?.derivativeType ?? "",
      messages
    )}`;

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
        <>
          <Link
            href={`/object-store/derivative/edit?id=${uuid}`}
            className="btn btn-primary ms-auto"
            style={{ width: "5rem" }}
          >
            <DinaMessage id="editButtonText" />
          </Link>
        </>
      </div>
    </ButtonBar>
  );

  return (
    <div>
      <Head title={fileName} />
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
                    <div
                      className="col-sm-1 mt-2"
                      style={{ marginLeft: "-5px" }}
                    >
                      <NotPubliclyReleasableWarning />
                    </div>
                    <div className="col-sm-11">
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
