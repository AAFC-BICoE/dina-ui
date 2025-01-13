import {
  ColumnDefinition,
  dateCell,
  descriptionCell,
  intlContext,
  ListLayoutFilterType,
  ListPageLayout
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
import { ManagedAttribute } from "../../types/collection-api";
import { Identifier } from "../../types/agent-api/resources/Identifier";

export function useFilterManagedAttribute() {
  const { locale: language } = useContext(intlContext);
  const filterManagedAttributes = (
    filterForm: any,
    value: ManagedAttribute
  ) => {
    let result = true;
    if (filterForm?.group) {
      result = result && value.group === filterForm.group;
    }
    if (filterForm?.filterBuilderModel?.value) {
      result =
        result &&
        (value.name
          .toLowerCase()
          .indexOf(filterForm.filterBuilderModel.value.toLowerCase()) > -1 ||
          (
            value.multilingualDescription?.descriptions?.filter(
              (item) =>
                item.lang === language &&
                (item.desc ?? "")
                  .toLowerCase()
                  .indexOf(filterForm.filterBuilderModel.value.toLowerCase()) >
                  -1
            ) ?? []
          ).length > 0);
    }
    return result;
  };
  return { filterManagedAttributes };
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
        <Link href={href} passHref={true}>
          <Button variant="info" className="mx-1 my-1">
            <DinaMessage id="createNewLabel" />
          </Button>
        </Link>
      </Card.Body>
    </Card>
  );
}

function AgentIdentifiersListView() {
  const COLLECTIONS_ATTRIBUTES_FILTER_ATTRIBUTES = [
    "name",
    "multilingualDescription"
  ];

  const AGENT_IDENTIFIERS_LIST_COLUMNS: ColumnDefinition<Identifier>[] = [
    {
      cell: ({
        row: {
          original: { id }
        }
      }) => <Link href={`/collection/managed-attribute/view?id=${id}`}></Link>,
      header: "Name",
      accessorKey: "name"
    },
    descriptionCell(false, false, "multilingualDescription"),
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
      <CreateNewSection href="/collection/managed-attribute/edit" />

      <ListPageLayout<Identifier>
        enableInMemoryFilter={true}
        // filterFn={filterManagedAttributes}
        filterType={ListLayoutFilterType.FREE_TEXT}
        filterAttributes={COLLECTIONS_ATTRIBUTES_FILTER_ATTRIBUTES}
        id="collections-module-managed-attribute-list"
        queryTableProps={{
          columns: AGENT_IDENTIFIERS_LIST_COLUMNS,
          path: "collection-api/managed-attribute?page[limit]=1000"
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
