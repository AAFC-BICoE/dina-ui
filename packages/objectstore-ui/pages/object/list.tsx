import {
  CheckBoxFieldProps,
  ColumnDefinition,
  FormikButton,
  ListPageLayout,
  useGroupedCheckBoxes
} from "common-ui";
import { Form, Formik } from "formik";
import { PersistedResource } from "kitsu";
import { noop, toPairs } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import { Head, Nav } from "../../components";
import { MetadataPreview } from "../../components/MetadataPreview";
import { ObjectStoreMessage } from "../../intl/objectstore-intl";
import { Metadata } from "../../types/objectstore-api";

type MetadataListLayoutType = "TABLE" | "GALLERY";

const METADATA_LIST_LAYOUT_COOKIE = "metadata-list-layout";

const OBJECT_LIST_PAGE_CSS = `
  html, body {
    margin: 0;
    height: 100%;
  }
  #__next {
    height: 100%;
  }
  .file-viewer-wrapper {
    height: 25%;
    max-height: 25%;
  }
`;

const HIGHLIGHT_COLOR = "rgb(222, 252, 222)";

export default function MetadataListPage() {
  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableMetadatas
  } = useGroupedCheckBoxes({
    fieldName: "selectedMetadatas"
  });

  const [cookies, setCookie] = useCookies([METADATA_LIST_LAYOUT_COOKIE]);
  const listLayoutType: MetadataListLayoutType =
    cookies[METADATA_LIST_LAYOUT_COOKIE] || "TABLE";

  const [previewMetadataId, setPreviewMetadataId] = useState<string | null>(
    null
  );
  const [tableSectionWidth, previewSectionWidth] = previewMetadataId
    ? [8, 4]
    : [12, 0];

  const tableWrapper = useRef<HTMLDivElement>(null);
  const previewWrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const resizePreviewWrapper = () => {
      if (tableWrapper.current && previewWrapper.current) {
        for (const wrapper of [tableWrapper.current, previewWrapper.current]) {
          const height =
            window.innerHeight - wrapper.getBoundingClientRect().top - 1;
          wrapper.style.height = `${height}px`;
        }
      }
    };

    window.onresize = resizePreviewWrapper;
    resizePreviewWrapper();
  });

  const METADATA_FILTER_ATTRIBUTES = ["originalFilename"];

  const METADATA_TABLE_COLUMNS: Array<ColumnDefinition<Metadata>> = [
    {
      Cell: ({ original: metadata }) => (
        <CheckBoxField key={metadata.id} resource={metadata} />
      ),
      Header: CheckBoxHeader,
      sortable: false
    },
    "id",
    "fileIdentifier",
    "originalFilename",
    "dcType",
    {
      Cell: ({ original }) => (
        <button
          className="btn btn-info w-100 h-100"
          onClick={() => setPreviewMetadataId(original.id)}
          type="button"
        >
          <ObjectStoreMessage id="viewPreviewButtonText" />
        </button>
      ),
      Header: ""
    }
  ];

  return (
    <div>
      <style>{OBJECT_LIST_PAGE_CSS}</style>
      <Head title="Stored Objects" />
      <Nav />
      <div className="container-fluid">
        <div className="list-inline">
          <div className="list-inline-item">
            <h1>
              <ObjectStoreMessage id="objectListTitle" />
            </h1>
          </div>
          <div className="list-inline-item">
            <ListLayoutSelector
              onChange={newValue =>
                setCookie(METADATA_LIST_LAYOUT_COOKIE, newValue)
              }
              value={listLayoutType}
            />
          </div>
          <div className="list-inline-item float-right">
            <Link href="/upload">
              <a>
                <ObjectStoreMessage id="uploadPageTitle" />
              </a>
            </Link>
          </div>
        </div>
        <div className="row">
          <div className={`col-${tableSectionWidth}`}>
            <div ref={tableWrapper} style={{ overflowY: "scroll" }}>
              <ListPageLayout<Metadata>
                filterAttributes={METADATA_FILTER_ATTRIBUTES}
                id="metadata-list"
                queryTableProps={{
                  columns: METADATA_TABLE_COLUMNS,
                  include: "acMetadataCreator",
                  onSuccess: res => setAvailableMetadatas(res.data),
                  path: "metadata",
                  reactTableProps: ({ response }) => ({
                    TbodyComponent:
                      listLayoutType === "GALLERY"
                        ? () => (
                            <StoredObjectGallery
                              CheckBoxField={CheckBoxField}
                              metadatas={response?.data ?? []}
                              previewMetadataId={previewMetadataId}
                              onSelectPreviewMetadataId={setPreviewMetadataId}
                            />
                          )
                        : undefined,
                    getTrProps: (_, rowInfo) => {
                      if (rowInfo) {
                        const metadata: Metadata = rowInfo.original;
                        return {
                          style: {
                            background:
                              metadata.id === previewMetadataId &&
                              HIGHLIGHT_COLOR
                          }
                        };
                      }
                      return {};
                    }
                  })
                }}
                WrapTable={MetadataTableWrapper}
              />
            </div>
          </div>
          <div className={`col-${previewSectionWidth}`}>
            <div ref={previewWrapper} style={{ overflowY: "scroll" }}>
              {previewMetadataId && (
                <>
                  <div style={{ height: "2.5rem" }}>
                    <Link href={`/object/view?id=${previewMetadataId}`}>
                      <a>Details Page</a>
                    </Link>
                    <button
                      className="btn btn-dark float-right"
                      type="button"
                      onClick={() => setPreviewMetadataId(null)}
                    >
                      <ObjectStoreMessage id="closePreviewButtonText" />
                    </button>
                  </div>
                  <div className="h-100">
                    <MetadataPreview metadataId={previewMetadataId} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Adds additional controls around the metadata table.
 */
function MetadataTableWrapper({ children }) {
  const router = useRouter();

  return (
    <Formik initialValues={{ selectedMetadatas: {} }} onSubmit={noop}>
      <Form>
        <div style={{ height: "1rem" }}>
          <div className="float-right">
            <FormikButton
              className="btn btn-primary "
              onClick={async values => {
                const metadataIds = toPairs(values.selectedMetadatas)
                  .filter(pair => pair[1])
                  .map(pair => pair[0]);

                await router.push({
                  pathname: "/metadata/edit",
                  query: { ids: metadataIds.join(",") }
                });
              }}
            >
              Edit selected
            </FormikButton>
          </div>
        </div>
        {children}
      </Form>
    </Formik>
  );
}

interface StoredObjectGalleryProps {
  CheckBoxField: React.ComponentType<CheckBoxFieldProps<Metadata>>;
  metadatas: Array<PersistedResource<Metadata>>;
  onSelectPreviewMetadataId: (id: string) => void;
  previewMetadataId: string | null;
}

function StoredObjectGallery({
  CheckBoxField,
  metadatas,
  onSelectPreviewMetadataId,
  previewMetadataId
}: StoredObjectGalleryProps) {
  return (
    <div className="container-fluid">
      <div className="row">
        {metadatas.map(metadata => {
          const { id, originalFilename } = metadata;
          return (
            <div className="col-md-2" key={id}>
              <div
                className="card card-body"
                style={{
                  backgroundColor:
                    previewMetadataId === id ? HIGHLIGHT_COLOR : undefined
                }}
              >
                <div // thumbnail placeholder
                  style={{
                    backgroundColor: "black",
                    height: "50px",
                    width: "100%"
                  }}
                />
                <Link href={`/object/view?id=${id}`}>
                  <a>{originalFilename}</a>
                </Link>
                <CheckBoxField resource={metadata} />
                <button
                  className="btn btn-info w-100 h-100"
                  onClick={() => onSelectPreviewMetadataId(id)}
                  type="button"
                >
                  <ObjectStoreMessage id="viewPreviewButtonText" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListLayoutSelector({ value, onChange }) {
  const items = [
    {
      layoutType: "TABLE",
      message: <ObjectStoreMessage id="metadataListTableLayout" />
    },
    {
      layoutType: "GALLERY",
      message: <ObjectStoreMessage id="metadataListGalleryLayout" />
    }
  ];

  return (
    <div className="list-inline">
      {items.map(({ message, layoutType }) => (
        <div className="list-inline-item">
          <label>
            <input
              key={layoutType}
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
