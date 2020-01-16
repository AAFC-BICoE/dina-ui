import {
  ColumnDefinition,
  FormikButton,
  ListPageLayout,
  useGroupedCheckBoxes
} from "common-ui";
import { Form, Formik } from "formik";
import { noop, toPairs } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Nav } from "../../components";
import { MetadataPreview } from "../../components/MetadataPreview";
import { ObjectStoreMessage } from "../../intl/objectstore-intl";
import { Metadata } from "../../types/objectstore-api";

export default function MetadataListPage() {
  const router = useRouter();

  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableMetadatas
  } = useGroupedCheckBoxes({
    fieldName: "selectedMetadatas"
  });

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

  const WrapTable = useMemo(
    () => ({ children }) => (
      <Formik initialValues={{ selectedMetadatas: {} }} onSubmit={noop}>
        <Form>
          <div style={{ height: "1rem" }}>
            <FormikButton
              className="btn btn-primary float-right"
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
          {children}
        </Form>
      </Formik>
    ),
    []
  );

  return (
    <div>
      <style>{OBJECT_LIST_PAGE_CSS}</style>
      <Head title="Objects" />
      <Nav />
      <div className="container-fluid">
        <h1>
          <ObjectStoreMessage id="objectListTitle" />
        </h1>
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
                  path: "metadata"
                }}
                WrapTable={WrapTable}
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
