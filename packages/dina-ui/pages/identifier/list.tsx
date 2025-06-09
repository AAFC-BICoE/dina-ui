import {
  ColumnDefinition,
  dateCell,
  intlContext,
  ListLayoutFilterType,
  ListPageLayout,
  titleCell
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

import { groupCell, GroupSelectField } from "../../components";
import PageLayout from "../../components/page/PageLayout";
import { AgentIdentifierType } from "packages/dina-ui/types/agent-api/resources/AgentIdentifierType";

export function useFilterIdentifierType() {
  const { locale: language } = useContext(intlContext);
  const filterIdentifierType = (
    filterForm: any,
    value: AgentIdentifierType
  ) => {
    let result = true;
    if (filterForm?.filterBuilderModel?.value) {
      if (value.name) {
        result =
          result &&
          (value.name
            .toLowerCase()
            .indexOf(filterForm.filterBuilderModel.value.toLowerCase()) > -1 ||
            (
              value.multilingualTitle?.titles?.filter(
                (item) =>
                  item.lang === language &&
                  (item.title ?? "")
                    .toLowerCase()
                    .indexOf(
                      filterForm.filterBuilderModel.value.toLowerCase()
                    ) > -1
              ) ?? []
            ).length > 0);
      }
    }
    return result;
  };
  return { filterIdentifierType };
}

export default function IdentifiersListPage() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(
    router.query.step ? Number(router.query.step) : 0
  );

  return (
    <PageLayout titleId="identifiers">
      <Tabs
        selectedIndex={currentStep}
        onSelect={setCurrentStep}
        id="identifierListTab"
        className="mb-3"
      >
        <TabList>
          <Tab>{formatMessage("agent")}</Tab>
        </TabList>
        <TabPanel>
          <AgentIdentifiersListView />
        </TabPanel>
      </Tabs>
    </PageLayout>
  );
}

interface CreateButtonProps {
  href: string;
}

function CreateNewSection({ href }: CreateButtonProps) {
  return (
    <Card bg="light" className="mb-4">
      <Card.Body className="ms-auto">
        <Link href={href} passHref={true} legacyBehavior>
          <Button variant="info" className="mx-1 my-1">
            <DinaMessage id="createNewLabel" />
          </Button>
        </Link>
      </Card.Body>
    </Card>
  );
}

function AgentIdentifiersListView() {
  const AGENT_IDENTIFIERS_FILTER_ATTRIBUTES = ["name", "multilingualTitle"];
  const { filterIdentifierType } = useFilterIdentifierType();

  const AGENT_IDENTIFIERS_LIST_COLUMNS: ColumnDefinition<AgentIdentifierType>[] =
    [
      {
        cell: ({ row: { original } }) => {
          return (
            <Link href={`/identifier/view?id=${original.id}`} legacyBehavior>
              {original.name}
            </Link>
          );
        },
        header: "Name",
        accessorKey: "name"
      },
      {
        cell: ({ row: { original } }) => {
          return original.term;
        },
        header: "Term",
        accessorKey: "name"
      },
      titleCell(false, false, "multilingualTitle"),
      groupCell("group"),
      "createdBy",
      dateCell("createdOn")
    ];

  return (
    <>
      <h3 className="mb-3">
        <DinaMessage id="agent" />
      </h3>

      {/* Quick create menu */}
      <CreateNewSection href="/identifier/edit" />

      <ListPageLayout<AgentIdentifierType>
        enableInMemoryFilter={true}
        filterFn={filterIdentifierType}
        filterType={ListLayoutFilterType.FREE_TEXT}
        filterAttributes={AGENT_IDENTIFIERS_FILTER_ATTRIBUTES}
        id="agent-identifiers-list"
        queryTableProps={{
          columns: AGENT_IDENTIFIERS_LIST_COLUMNS,
          path: "agent-api/identifier-type?page[limit]=1000"
        }}
        additionalFilters={(filterForm) => ({
          isCompleted: false,
          // Apply group filter:
          ...(filterForm.group && { rsql: `group==${filterForm.group}` })
        })}
        filterFormchildren={({ submitForm }) => (
          <div className="mb-3">
            <div style={{ width: "300px" }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption={true}
              />
            </div>
          </div>
        )}
      />
    </>
  );
}
