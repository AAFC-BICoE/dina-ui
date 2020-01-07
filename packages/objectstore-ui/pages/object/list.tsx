import { ColumnDefinition, QueryTable, useGroupedCheckBoxes } from "common-ui";
import { Form, Formik } from "formik";
import { noop, toPairs } from "lodash";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import { CookieSetOptions } from "universal-cookie";
import { Head, Nav } from "../../components";
import { MetadataPreview } from "../../components/MetadataPreview";
import { ObjectStoreMessage } from "../../intl/objectstore-intl";
import { ManagedAttribute } from "../../types/objectstore-api/resources/ManagedAttribute";

const TABLE_PAGE_SIZE_COOKIE = "tablePageSize";
const TABLE_SORT_COOKIE = "tableSort";

const COOKIE_OPTIONS: CookieSetOptions = { expires: new Date("3000-01-01") };

export default function MetadataListPage() {
  const router = useRouter();

  // Use a cookie hook to get the cookies, and re-render when the watched cookies are changed.
  const [cookies, setCookie] = useCookies([
    TABLE_PAGE_SIZE_COOKIE,
    TABLE_SORT_COOKIE
  ]);

  // Default sort and page-size from the QueryTable. These are only used on the initial
  // QueryTable render, and are saved as cookies when the table's sort or page-size is changed.
  const defaultSort = cookies[TABLE_SORT_COOKIE];
  const defaultPageSize = cookies[TABLE_PAGE_SIZE_COOKIE];

  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableMetadatas
  } = useGroupedCheckBoxes({
    fieldName: "selectedMetadatas"
  });

  const [previewMetadataId, setPreviewMetadataId] = useState<string>();

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

  const ATTRIBUTES_LIST_COLUMNS: Array<ColumnDefinition<ManagedAttribute>> = [
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
          View
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
  `;

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
          <div className="col-8">
            <div ref={tableWrapper} style={{ overflowY: "scroll" }}>
              <Formik initialValues={{ selectedMetadatas: {} }} onSubmit={noop}>
                {formik => (
                  <Form>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        const metadataIds = toPairs(
                          formik.values.selectedMetadatas
                        )
                          .filter(pair => pair[1])
                          .map(pair => pair[0]);

                        await router.push({
                          pathname: "/metadata/edit",
                          query: { ids: metadataIds.join(",") }
                        });
                      }}
                    >
                      Edit selected
                    </button>
                    <QueryTable
                      columns={ATTRIBUTES_LIST_COLUMNS}
                      path="metadata"
                      defaultPageSize={defaultPageSize}
                      defaultSort={defaultSort}
                      onPageSizeChange={newSize =>
                        setCookie(
                          TABLE_PAGE_SIZE_COOKIE,
                          newSize,
                          COOKIE_OPTIONS
                        )
                      }
                      onSortedChange={newSort =>
                        setCookie(TABLE_SORT_COOKIE, newSort, COOKIE_OPTIONS)
                      }
                      onSuccess={response =>
                        setAvailableMetadatas(response.data)
                      }
                    />
                  </Form>
                )}
              </Formik>
            </div>
          </div>
          <div className="col-4">
            <div ref={previewWrapper} style={{ overflowY: "scroll" }}>
              {previewMetadataId && (
                <MetadataPreview metadataId={previewMetadataId} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
