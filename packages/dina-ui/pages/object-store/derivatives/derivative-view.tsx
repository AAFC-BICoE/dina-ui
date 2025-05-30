import { ButtonBar, DinaForm, LoadingSpinner, withResponse } from "common-ui";
import { find } from "lodash";
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
import { MetadataFileView } from "../../../components/object-store/metadata/MetadataFileView";
import { DerivativeDetails } from "../../../components/object-store/derivative/DerivativeDetails";

const OBJECT_DETAILS_PAGE_CSS = `
  .file-viewer-wrapper img {
    max-width: 100%;
    height: auto;
  }
`;

export default function MetadataViewPage() {
  const router = useRouter();
  const uuid = String(router.query.id);
  const parentUuid = String(router.query.parentId);
  const query = useMetadataViewQuery(parentUuid);
  if (query?.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const metadata = query.response?.data;
  const derivative = find(
    metadata?.derivatives,
    (derivative) => derivative.id === uuid
  ) as any;

  if (derivative && derivative.objectUpload)
    derivative.acCaption = derivative?.objectUpload.originalFilename;

  const fileName =
    derivative?.objectUpload?.originalFilename ||
    `${metadata?.originalFilename} Thumbnail`;

  const buttonBar = (
    <ButtonBar className="mb-3">
      <div className="col-md-4 mt-2">
        <Link href={`/object-store/object/view?id=${parentUuid}`}>
          <a>Back to parent file: {metadata?.originalFilename}</a>
        </Link>
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
        {withResponse(query, (response) => {
          return (
            <div className="row mt-3">
              <div className="col-md-4">
                <MetadataFileView
                  metadata={derivative as any}
                  hideDownload={false}
                />
              </div>
              <div className="col-md-8">
                <DinaForm initialValues={response.data} readOnly={true}>
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
