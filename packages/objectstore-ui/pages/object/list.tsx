import { ColumnDefinition, QueryTable, useGroupedCheckBoxes } from "common-ui";
import { Form, Formik } from "formik";
import { noop } from "lodash";
import { toPairs } from "lodash";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { CookieSetOptions } from "universal-cookie";
import { Head, Nav } from "../../components";
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
    "dcType"
  ];

  return (
    <div>
      <Head title="Objects" />
      <Nav />
      <div className="container-fluid">
        <h1>
          <ObjectStoreMessage id="objectListTitle" />
        </h1>
        <Formik initialValues={{ selectedMetadatas: {} }} onSubmit={noop}>
          {formik => (
            <Form>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const metadataIds = toPairs(formik.values.selectedMetadatas)
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
                  setCookie(TABLE_PAGE_SIZE_COOKIE, newSize, COOKIE_OPTIONS)
                }
                onSortedChange={newSort =>
                  setCookie(TABLE_SORT_COOKIE, newSort, COOKIE_OPTIONS)
                }
                onSuccess={response => setAvailableMetadatas(response.data)}
              />
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
