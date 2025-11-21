import { useLocalStorage } from "@rehooks/local-storage";
import {
  dateCell,
  FieldHeader,
  LoadingSpinner,
  QueryPage,
  stringArrayCell
} from "common-ui";
import Link from "next/link";
import {
  DynamicFieldsMappingConfig,
  TableColumn
} from "../../../../common-ui/lib/list-page/types";
import { Component, useMemo, useState, useEffect } from "react";
import { Footer, Head, Nav, ThumbnailCell } from "../../../components";
import {
  MetadataPreview,
  StoredObjectGallery
} from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";
import Offcanvas from "react-bootstrap/Offcanvas";
import { FaFileArrowUp } from "react-icons/fa6";

type MetadataListLayoutType = "TABLE" | "GALLERY";

export const OBJECT_STORE_NON_EXPORTABLE_COLUMNS: string[] = [
  "selectColumn",
  "thumbnail",
  "objectStorePreview",
  "viewDetails",
  "imageLink."
];

const LIST_LAYOUT_STORAGE_KEY = "metadata-list-layout";

const HIGHLIGHT_COLOR = "rgb(222, 252, 222)";

export const dynamicFieldMappingForMetadata: DynamicFieldsMappingConfig = {
  fields: [
    {
      type: "managedAttribute",
      label: "managedAttributes",
      path: "data.attributes.managedAttributes",
      apiEndpoint: "objectstore-api/managed-attribute",
      component: "ENTITY"
    },
    {
      type: "imageLink",
      label: "_imageLink",
      path: "_imageLink"
    }
  ],
  relationshipFields: []
};

export default function MetadataListPage() {
  const { formatMessage } = useDinaIntl();

  const [listLayoutType, setListLayoutType] =
    useLocalStorage<MetadataListLayoutType>(LIST_LAYOUT_STORAGE_KEY);

  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Cleanup function to remove event listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to determine col-# based on the screensize. This can be adjusted for specific sizes
  // to make sure the query page is still visible on the screen.
  const getTableSectionWidth = (width) => {
    if (width < 1100) {
      return 5;
    } else if (width < 1200) {
      return 6;
    } else if (width < 1500) {
      return 7;
    } else if (width < 1800) {
      return 8;
    } else if (width < 2000) {
      return 9;
    } else if (width < 2300) {
      return 10;
    } else if (width < 2400) {
      return 11;
    } else {
      return 12;
    }
  };

  const [previewMetadata, setPreviewMetadata] = useState<any | null>(null);
  const tableSectionWidth = previewMetadata?.id
    ? getTableSectionWidth(screenWidth)
    : 12;

  const METADATA_TABLE_COLUMNS: TableColumn<any>[] = [
    {
      cell: ({ row: { original } }) =>
        (original as any)?.data?.attributes?.resourceExternalURL ? (
          <Link
            href={`/object-store/object/external-resource-view?id=${original?.id}`}
            className="m-auto"
            style={{ whiteSpace: "nowrap" }}
          >
            <DinaMessage id="viewDetails" />
          </Link>
        ) : (original as any).data?.attributes?.originalFilename ? (
          <Link
            href={`/object-store/object/view?id=${original.id}`}
            passHref={true}
            id={`file-name-${original.id}`}
            style={{ whiteSpace: "nowrap" }}
          >
            <DinaMessage id="viewDetails" />
          </Link>
        ) : null,
      accessorKey: "data.attributes.id",
      additionalAccessors: [
        "data.attributes.originalFilename",
        "data.attributes.resourceExternalURL"
      ],
      header: () => <DinaMessage id="viewDetails" />,
      enableSorting: false,
      id: "viewDetails"
    },
    ThumbnailCell({
      bucketField: "data.attributes.bucket"
    }),
    {
      header: () => <FieldHeader name="acCaption" />,
      accessorKey: "data.attributes.acCaption",
      isKeyword: true,
      id: "acCaption"
    },
    dateCell("acDigitizationDate", "data.attributes.acDigitizationDate"),
    dateCell("xmpMetadataDate", "data.attributes.xmpMetadataDate"),
    {
      cell: ({
        row: {
          original: { included }
        }
      }) =>
        included?.acMetadataCreator?.id ? (
          <Link href={`/person/view?id=${included?.acMetadataCreator?.id}`}>
            {included?.acMetadataCreator?.attributes?.displayName}
          </Link>
        ) : null,
      header: () => <FieldHeader name="acMetadataCreator.displayName" />,
      relationshipType: "person",
      accessorKey: "included.attributes.displayName",
      isKeyword: true,
      enableSorting: false,
      id: "acMetadataCreator.displayName"
    },
    {
      cell: ({
        row: {
          original: { included }
        }
      }) =>
        included?.dcCreator?.id ? (
          <Link href={`/person/view?id=${included?.dcCreator?.id}`}>
            {included?.dcCreator?.attributes?.displayName}
          </Link>
        ) : null,
      header: () => <FieldHeader name="dcCreator.displayName" />,
      relationshipType: "person",
      accessorKey: "included.attributes.displayName",
      isKeyword: true,
      enableSorting: false,
      id: "dcCreator.displayName"
    },
    stringArrayCell("acTags", "data.attributes.acTags"),
    {
      id: "objectStorePreview",
      cell: ({ row: { original } }) => (
        <div className="d-flex h-100">
          <button
            className="btn btn-info m-auto preview-button"
            onClick={() => setPreviewMetadata(original)}
            type="button"
          >
            <DinaMessage id="viewPreviewButtonText" />
          </button>
        </div>
      ),
      header: () => (
        <div id="acPreviewLinksHeader" style={{ whiteSpace: "nowrap" }}>
          <DinaMessage id="viewPreviewButtonText" />
        </div>
      ),
      enableSorting: false
    }
  ];

  // Workaround to make sure react-table doesn't unmount TBodyComponent
  // when MetadataListPage is re-rendered:
  const TBodyGallery = useMemo(
    () =>
      class ReusedTBodyComponent extends Component {
        public static innerComponent;
        public render() {
          return ReusedTBodyComponent.innerComponent;
        }
      },
    []
  );

  return (
    <div>
      <Head title={formatMessage("objectListTitle")} />
      <Nav />
      <main className="large-container-fluid">
        <div className="list-inline">
          <div className="list-inline-item">
            <h1 id="wb-cont">
              <DinaMessage id="objectListTitle" />
            </h1>
          </div>
          <div className="list-inline-item">
            <ListLayoutSelector
              onChange={(newValue) => setListLayoutType(newValue)}
              value={listLayoutType ?? undefined}
            />
          </div>
          <div className="list-inline-item float-end">
            <Link
              href="/object-store/upload"
              className="btn btn-primary ms-auto"
            >
              <FaFileArrowUp className="me-2" />
              <DinaMessage id="uploadPageTitle" />
            </Link>
          </div>
        </div>
        <div className="row">
          <div className={`table-section col-${tableSectionWidth}`}>
            <div className="split-page-panel">
              <QueryPage
                indexName={"dina_object_store_index"}
                uniqueName="object-store-list"
                dynamicFieldMapping={dynamicFieldMappingForMetadata}
                mandatoryDisplayedColumns={["thumbnail", "viewDetails"]}
                nonExportableColumns={OBJECT_STORE_NON_EXPORTABLE_COLUMNS}
                nonSearchableColumns={[
                  "acMetadataCreator.displayName",
                  "dcCreator.displayName",
                  "_imageLink"
                ]}
                enableRelationshipPresence={true}
                columns={METADATA_TABLE_COLUMNS}
                bulkDeleteButtonProps={{
                  typeName: "metadata",
                  apiBaseUrl: "/objectstore-api"
                }}
                bulkEditPath={"/object-store/metadata/bulk-edit"}
                dataExportProps={{
                  dataExportPath: "/export/data-export/export",
                  entityLink: "/object-store/object"
                }}
                singleEditPath={"/object-store/metadata/edit"}
                defaultSort={[
                  {
                    desc: true,
                    id: "xmpMetadataDate"
                  }
                ]}
                reactTableProps={(responseData, CheckBoxField) => {
                  TBodyGallery.innerComponent = (
                    <StoredObjectGallery
                      CheckBoxField={CheckBoxField}
                      metadatas={(responseData as any) ?? []}
                      previewMetadataId={previewMetadata?.id as any}
                      onSelectPreviewMetadata={setPreviewMetadata}
                    />
                  );

                  return {
                    TbodyComponent:
                      listLayoutType === "GALLERY" ? TBodyGallery : undefined,
                    getTrProps: (_, rowInfo) => {
                      if (rowInfo) {
                        const metadata: Metadata = rowInfo.original;
                        return {
                          style: {
                            background:
                              metadata.id === previewMetadata?.id &&
                              HIGHLIGHT_COLOR
                          }
                        };
                      }
                      return {};
                    },
                    enableSorting: true,
                    enableMultiSort: true
                  };
                }}
              />
            </div>
          </div>

          <Offcanvas
            show={previewMetadata !== null}
            placement="end"
            scroll={true}
            backdrop={false}
            onHide={() => setPreviewMetadata(null)}
          >
            <Offcanvas.Header closeButton={true}>
              <Offcanvas.Title>
                <DinaMessage id="previewLabel" />
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {previewMetadata?.id ? (
                <MetadataPreview metadataId={previewMetadata?.id} />
              ) : (
                <LoadingSpinner loading={true} />
              )}
            </Offcanvas.Body>
          </Offcanvas>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ListLayoutSelector({ value = "TABLE", onChange }) {
  const items = [
    {
      layoutType: "TABLE",
      message: <DinaMessage id="metadataListTableLayout" />
    },
    {
      layoutType: "GALLERY",
      message: <DinaMessage id="metadataListGalleryLayout" />
    }
  ];

  return (
    <div className="list-layout-selector list-inline">
      {items.map(({ message, layoutType }) => (
        <div className="list-inline-item" key={layoutType}>
          <label>
            <input
              type="radio"
              checked={value === layoutType}
              onChange={() => onChange(layoutType)}
            />
            {message}
          </label>
        </div>
      ))}
    </div>
  );
}
