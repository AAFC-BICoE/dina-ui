import { useLocalStorage } from "@rehooks/local-storage";
import {
  ColumnDefinition,
  FormikButton,
  ListPageLayout,
  SplitPagePanel,
  useGroupedCheckBoxes
} from "common-ui";
import { Form, Formik, FormikContext } from "formik";
import { noop, toPairs } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { Head, Nav, StoredObjectGallery } from "../../components";
import { MetadataPreview } from "../../components/metadata/MetadataPreview";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../../intl/objectstore-intl";
import { Metadata } from "../../types/objectstore-api";

type MetadataListLayoutType = "TABLE" | "GALLERY";

const LIST_LAYOUT_STORAGE_KEY = "metadata-list-layout";

const HIGHLIGHT_COLOR = "rgb(222, 252, 222)";

/** Values of the Formik form that wraps the metadata list */
interface MetadataListFormValues {
  /** Tracks which metadata IDs are selected. */
  selectedMetadatas: Record<string, boolean>;
}

export default function MetadataListPage() {
  const { formatMessage } = useObjectStoreIntl();

  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableMetadatas
  } = useGroupedCheckBoxes({
    fieldName: "selectedMetadatas"
  });

  const [listLayoutType, setListLayoutType] = useLocalStorage<
    MetadataListLayoutType
  >(LIST_LAYOUT_STORAGE_KEY);

  const [previewMetadataId, setPreviewMetadataId] = useState<string | null>(
    null
  );
  const [tableSectionWidth, previewSectionWidth] = previewMetadataId
    ? [8, 4]
    : [12, 0];

  const METADATA_FILTER_ATTRIBUTES = [
    "originalFilename",
    "dcFormat",
    "xmpRightsWebStatement",
    "dcRights",
    "acMetadataCreator.displayName",
    "dcCreator.displayName"
  ];

  const METADATA_TABLE_COLUMNS: Array<ColumnDefinition<Metadata>> = [
    {
      Cell: ({ original: metadata }) => (
        <CheckBoxField key={metadata.id} resource={metadata} />
      ),
      Header: CheckBoxHeader,
      sortable: false
    },
    "originalFilename",
    "dcFormat",
    "acDigitizationDate",
    "xmpMetadataDate",
    "acMetadataCreator.displayName",
    {
      Cell: ({ original: { acTags } }) => acTags?.join(", "),
      accessor: "acTags"
    },
    {
      Cell: ({ original }) => (
        <button
          className="btn btn-info w-100 h-100 preview-button"
          onClick={() => setPreviewMetadataId(original.id)}
          type="button"
        >
          <ObjectStoreMessage id="viewPreviewButtonText" />
        </button>
      ),
      Header: "",
      sortable: false
    }
  ];

  return (
    <div>
      <Head title={formatMessage("objectListTitle")} />
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
              onChange={newValue => setListLayoutType(newValue)}
              value={listLayoutType ?? undefined}
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
          <div className={`table-section col-${tableSectionWidth}`}>
            <SplitPagePanel>
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
                WrapTable={MetadataListWrapper}
              />
            </SplitPagePanel>
          </div>
          <div className={`preview-section col-${previewSectionWidth}`}>
            <SplitPagePanel>
              {previewMetadataId && (
                <>
                  <div style={{ height: "2.5rem" }}>
                    <Link href={`/object/view?id=${previewMetadataId}`}>
                      <a>
                        <ObjectStoreMessage id="metadataDetailsPageLink" />
                      </a>
                    </Link>
                    <button
                      className="btn btn-dark float-right preview-button"
                      type="button"
                      onClick={() => setPreviewMetadataId(null)}
                    >
                      <ObjectStoreMessage id="closePreviewButtonText" />
                    </button>
                  </div>
                  <MetadataPreview metadataId={previewMetadataId} />
                </>
              )}
            </SplitPagePanel>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Adds additional controls around the metadata table.
 */
function MetadataListWrapper({ children }) {
  const router = useRouter();

  return (
    <Formik<MetadataListFormValues>
      initialValues={{ selectedMetadatas: {} }}
      onSubmit={noop}
    >
      <Form>
        <div style={{ height: "1rem" }}>
          <div className="float-right">
            <FormikButton
              buttonProps={(ctx: FormikContext<MetadataListFormValues>) => ({
                // Disable the button if none are selected:
                disabled: !Object.values(ctx.values.selectedMetadatas).reduce(
                  (a, b) => a || b,
                  false
                )
              })}
              className="btn btn-primary metadata-bulk-edit-button"
              onClick={async (values: MetadataListFormValues) => {
                const metadataIds = toPairs(values.selectedMetadatas)
                  .filter(pair => pair[1])
                  .map(pair => pair[0]);

                await router.push({
                  pathname: "/metadata/edit",
                  query: { ids: metadataIds.join(",") }
                });
              }}
            >
              <ObjectStoreMessage id="editSelectedButtonText" />
            </FormikButton>
          </div>
        </div>
        {children}
      </Form>
    </Formik>
  );
}

function ListLayoutSelector({ value = "TABLE", onChange }) {
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
