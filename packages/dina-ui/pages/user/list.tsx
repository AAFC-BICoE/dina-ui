import {
  ButtonBar,
  CreateButton,
  dateCell,
  ListPageLayout,
  stringArrayCell
} from "common-ui";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

const USER_TABLE_COLUMNS = [
  "username",
  "firstName",
  "lastName",
  "emailAddress",
  { ...stringArrayCell("groups"), sortable: false },
  { ...stringArrayCell("roles"), sortable: false },
  dateCell("createdOn")
];

export default function AgentListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("userListTitle")} />
      <Nav />
      <div className="container-fluid">
        <h1>
          <DinaMessage id="userListTitle" />
        </h1>
        <ListPageLayout
          id="user-list"
          queryTableProps={{
            columns: USER_TABLE_COLUMNS,
            path: "user-api/user"
          }}
        />
      </div>
      <Footer />
    </div>
  );
}
