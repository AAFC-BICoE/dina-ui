import {
  ButtonBar,
  CreateButton,
  descriptionCell,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import PageLayout from "packages/dina-ui/components/page/PageLayout";

const PROJECT_FILTER_ATTRIBUTES = ["name", "status", "multilingualDescription"];
const PROJECT_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/collection/project/view?id=${id}`}>{name}</Link>
    ),
    accessor: "name"
  },
  "status",
  descriptionCell("multilingualDescription")
];

export default function collectionMethodListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <PageLayout titleId="projectListTitle" buttonBarContent = {<CreateButton entityLink="/collection/project" />}>
        <ListPageLayout
          filterAttributes={PROJECT_FILTER_ATTRIBUTES}
          id="project-list"
          queryTableProps={{
            columns: PROJECT_TABLE_COLUMNS,
            path: "collection-api/project",
            defaultSort: [
              {
                id: "name",
                desc: false
              }
            ]
          }}
        />
    </PageLayout>
  );
}
