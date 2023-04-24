import { useLocalStorage } from "@rehooks/local-storage";
import {
  dateCell,
  FilterAttribute,
  filterBy,
  QueryPage,
  SplitPagePanel,
  stringArrayCell
} from "common-ui";
import Link from "next/link";
import { TableColumn } from "common-ui/lib/list-page/types";
import { Component, useMemo, useState } from "react";
import { Head, Nav, thumbnailCell } from "../../../components";
import {
  MetadataPreview,
  StoredObjectGallery
} from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata, Person } from "../../../types/objectstore-api";

type MetadataListLayoutType = "TABLE" | "GALLERY";

const LIST_LAYOUT_STORAGE_KEY = "metadata-list-layout";

const HIGHLIGHT_COLOR = "rgb(222, 252, 222)";

export const METADATA_FILTER_ATTRIBUTES: FilterAttribute[] = [
  "originalFilename",
  "dcFormat",
  "xmpRightsWebStatement",
  "dcRights",
  {
    name: "acDigitizationDate",
    type: "DATE"
  },
  {
    name: "xmpMetadataDate",
    type: "DATE"
  },
  {
    name: "acMetadataCreator",
    type: "DROPDOWN",
    resourcePath: "agent-api/person",
    filter: filterBy(["displayName"]),
    optionLabel: (person) => (person as Person).displayName ?? person.id
  }
];

export default function MetadataListPage() {
  const { formatMessage } = useDinaIntl();

  const [listLayoutType, setListLayoutType] =
    useLocalStorage<MetadataListLayoutType>(LIST_LAYOUT_STORAGE_KEY);

  const [previewMetadata, setPreviewMetadata] = useState<any | null>(null);
  const [tableSectionWidth, previewSectionWidth] = previewMetadata?.id
    ? [8, 4]
    : [12, 0];

  const METADATA_TABLE_COLUMNS: TableColumn<Metadata>[] = [
    thumbnailCell({
      bucketField: "data.attributes.bucket",
      fileIdentifierField: "data.attributes.fileIdentifier"
    }),
    {
      Cell: ({ original: { id, data } }) =>
        data?.attributes?.originalFilename ? (
          <Link href={`/object-store/object/view?id=${id}`} passHref={true}>
            <a id={`file-name-${id}`}>{data?.attributes?.originalFilename}</a>
          </Link>
        ) : null,
      label: "originalFilename",
      accessor: "data.attributes.originalFilename",
      isKeyword: true
    },
    {
      label: "acCaption",
      accessor: "data.attributes.acCaption",
      isKeyword: true
    },
    dateCell("acDigitizationDate", "data.attributes.acDigitizationDate"),
    dateCell("xmpMetadataDate", "data.attributes.xmpMetadataDate"),
    {
      Cell: ({ original: { included } }) => (
        <>{included?.acMetadataCreator?.attributes?.displayName}</>
      ),
      label: "acMetadataCreator.displayName",
      relationshipType: "person",
      accessor: "included.attributes.displayName",
      isKeyword: true,
      sortable: false
    },
    stringArrayCell("acTags", "data.attributes.acTags"),
    {
      Cell: ({ original }) => (
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
      Header: (
        <div id="acPreviewLinksHeader">
          <DinaMessage id="viewPreviewButtonText" />
        </div>
      ),
      sortable: false,
      width: 200
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
      <main className="container-fluid">
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
            <Link href="/object-store/upload">
              <a>
                <DinaMessage id="uploadPageTitle" />
              </a>
            </Link>
          </div>
        </div>
        <div className="row">
          <div className={`table-section col-${tableSectionWidth}`}>
            <SplitPagePanel>
              <QueryPage
                indexName={"dina_object_store_index"}
                dynamicFieldMapping={{
                  fields: [
                    {
                      type: "managedAttribute",
                      label: "managedAttributes",
                      path: "data.attributes.managedAttributes",
                      apiEndpoint: "objectstore-api/managed-attribute"
                    }
                  ],
                  relationshipFields: []
                }}
                columns={METADATA_TABLE_COLUMNS}
                bulkDeleteButtonProps={{
                  typeName: "metadata",
                  apiBaseUrl: "/objectstore-api"
                }}
                bulkEditPath={"/object-store/metadata/bulk-edit"}
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
                    }
                  };
                }}
              />
            </SplitPagePanel>
          </div>
          <div className={`preview-section col-${previewSectionWidth}`}>
            <SplitPagePanel>
              {previewMetadata?.id && (
                <>
                  <div style={{ height: "2.5rem" }}>
                    <Link
                      href={`/object-store/object/${
                        previewMetadata.data?.attributes?.resourceExternalURL
                          ? "external-resource-view"
                          : "view"
                      }?id=${previewMetadata.id}`}
                    >
                      <a>
                        <DinaMessage id="detailsPageLink" />
                      </a>
                    </Link>
                    <button
                      className="btn btn-dark float-end preview-button"
                      type="button"
                      onClick={() => setPreviewMetadata(null)}
                    >
                      <DinaMessage id="closePreviewButtonText" />
                    </button>
                  </div>
                  <MetadataPreview metadataId={previewMetadata?.id} />
                </>
              )}
            </SplitPagePanel>
          </div>
        </div>
      </main>
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
