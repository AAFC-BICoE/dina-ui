import {
  ApiClientContext,
  BackToListButton,
  ButtonBar,
  DeleteButton,
  LoadingSpinner,
  useQuery
} from "common-ui";
import { KitsuResponse } from "kitsu";
import Link from "next/link";
import { useRouter } from "next/router";
import { ObjectUpload } from "packages/dina-ui/types/objectstore-api/resources/ObjectUpload";
import { Footer, Head, Nav } from "../../../components";
import {
  ExifView,
  FileView,
  MetadataDetails
} from "../../../components/object-store";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";
import { useContext, useState } from "react";

const OBJECT_DETAILS_PAGE_CSS = `
  .file-viewer-wrapper img {
    max-width: 100%;
    height: auto;
  }
`;

export default function MetadataViewPage() {
  const { apiClient } = useContext(ApiClientContext);
  const [objectUpload, setObjectUpload] = useState<ObjectUpload>();
  const router = useRouter();

  const id = router.query.id as string;

  const getObjetUpload = async (
    mydata: KitsuResponse<Metadata, ObjectUpload>
  ) => {
    const objectUploadResp = await apiClient.get<ObjectUpload>(
      "objectstore-api/object-upload",
      {
        filter: { fileIdentifier: `${mydata?.data.fileIdentifier}` }
      }
    );

    setObjectUpload(objectUploadResp?.data[0]);
  };

  const { loading, response } = useQuery<Metadata, ObjectUpload>(
    {
      include: "acDerivedFrom,managedAttributeMap,acMetadataCreator,dcCreator",
      path: `objectstore-api/metadata/${id}`
    },
    {
      joinSpecs: [
        {
          apiBaseUrl: "/agent-api",
          idField: "acMetadataCreator",
          joinField: "acMetadataCreator",
          path: metadata => `person/${metadata.acMetadataCreator.id}`
        },
        {
          apiBaseUrl: "/agent-api",
          idField: "dcCreator",
          joinField: "dcCreator",
          path: metadata => `person/${metadata.dcCreator.id}`
        }
      ],
      onSuccess: getObjetUpload
    }
  );

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (response) {
    const metadata = response.data;

    const fileId =
      metadata.acSubType === "THUMBNAIL"
        ? `${metadata.fileIdentifier}.thumbnail`
        : metadata.fileIdentifier;

    const filePath = `/api/objectstore-api/file/${metadata.bucket}/${fileId}`;
    // fileExtension should always be available when getting the Metadata from the back-end:
    const fileType = (metadata.fileExtension as string)
      .replace(/\./, "")
      .toLowerCase();

    return (
      <div>
        <Head title={metadata.originalFilename} />
        <Nav />
        <ButtonBar>
          <Link href={`/object-store/metadata/single-record-edit?id=${id}`}>
            <a className="btn btn-primary">
              <DinaMessage id="editButtonText" />
            </a>
          </Link>
          <Link href={`/object-store/metadata/revisions?id=${id}`}>
            <a className="btn btn-info">
              <DinaMessage id="revisionsButtonText" />
            </a>
          </Link>
          <BackToListButton entityLink="/object-store/object" />
          <DeleteButton
            className="ml-5"
            id={id}
            options={{ apiBaseUrl: "/objectstore-api" }}
            postDeleteRedirect="/object-store/object/list"
            type="metadata"
          />
        </ButtonBar>
        <style>{OBJECT_DETAILS_PAGE_CSS}</style>
        <main className="container-fluid">
          <div className="row">
            <div className="col-md-4">
              <FileView
                clickToDownload={true}
                filePath={filePath}
                fileType={fileType}
              />
            </div>
            <div className="col-md-8">
              <div className="container">
                <div className="form-group">
                  <Link
                    href={`/object-store/metadata/single-record-edit?id=${id}`}
                  >
                    <a className="btn btn-primary">
                      <DinaMessage id="editButtonText" />
                    </a>
                  </Link>
                </div>
                <MetadataDetails metadata={metadata} />
                <ExifView objectUpload={objectUpload as ObjectUpload} />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return null;
}
