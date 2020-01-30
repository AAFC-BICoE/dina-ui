import { ColumnDefinition, QueryTable } from "common-ui";
import { useCookies } from "react-cookie";
import { CookieSetOptions } from "universal-cookie";
import { Head, Nav } from "../../components";
import { ObjectStoreMessage } from "../../intl/objectstore-intl";
import { ManagedAttribute } from "../../types/objectstore-api/resources/ManagedAttribute";

const ATTRIBUTES_LIST_COLUMNS: Array<ColumnDefinition<ManagedAttribute>> = [
  "name",
  "managedAttributeType",
  "acceptedValues"
];

const TABLE_PAGE_SIZE_COOKIE = "tablePageSize";
const TABLE_SORT_COOKIE = "tableSort";

const COOKIE_OPTIONS: CookieSetOptions = { expires: new Date("3000-01-01") };

export default function ManagedAttributesListPage() {
  // Use a cookie hook to get the cookies, and re-render when the watched cookies are changed.
  const [cookies, setCookie] = useCookies([
    TABLE_PAGE_SIZE_COOKIE,
    TABLE_SORT_COOKIE
  ]);

  // Default sort and page-size from the QueryTable. These are only used on the initial
  // QueryTable render, and are saved as cookies when the table's sort or page-size is changed.
  const defaultSort = cookies[TABLE_SORT_COOKIE];
  const defaultPageSize = cookies[TABLE_PAGE_SIZE_COOKIE];

  return (
    <div>
      <Head title="Managed Attributes" />
      <div className="container-fluid">
        <h1>
          <ObjectStoreMessage id="managedAttributeListTitle" />
        </h1>
        <br />
        <button>
          <ObjectStoreMessage id="addManagedAttributeButtonText" />
        </button>
        <br />
        <QueryTable
          columns={ATTRIBUTES_LIST_COLUMNS}
          path={"managed-attribute"}
          defaultPageSize={defaultPageSize}
          defaultSort={defaultSort}
          onPageSizeChange={newSize =>
            setCookie(TABLE_PAGE_SIZE_COOKIE, newSize, COOKIE_OPTIONS)
          }
          onSortedChange={newSort =>
            setCookie(TABLE_SORT_COOKIE, newSort, COOKIE_OPTIONS)
          }
        />
      </div>
    </div>
  );
}
