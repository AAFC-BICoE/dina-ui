import { CreateButton } from "common-ui";
import { useRouter } from "next/router";

import PageLayout from "../../components/page/PageLayout";
import {
  ManagedAttributeListView,
  ModuleTabConfig,
  ModuleTabs
} from "../../components";

interface ManagedAttributeTabMeta {
  titleKey: string;
  apiPath: string;
  prependLink: string;
  componentSupport: boolean;
}

const TAB_META: ManagedAttributeTabMeta[] = [
  {
    titleKey: "collectionListTitle",
    apiPath: "/collection-api/managed-attribute",
    prependLink: "/collection/managed-attribute",
    componentSupport: true
  },
  {
    titleKey: "objectStoreTitle",
    apiPath: "/objectstore-api/managed-attribute",
    prependLink: "/object-store/managed-attribute",
    componentSupport: false
  },
  {
    titleKey: "loanTransactionsSectionTitle",
    apiPath: "/loan-transaction-api/managed-attribute",
    prependLink: "/loan-transaction/managed-attribute",
    componentSupport: false
  },
  {
    titleKey: "seqdbManagedAttributeTitle",
    apiPath: "/seqdb-api/managed-attribute",
    prependLink: "/seqdb/managed-attribute",
    componentSupport: false
  }
];

const TABS: ModuleTabConfig[] = TAB_META.map(({ titleKey }) => ({ titleKey }));

export default function ManagedAttributesListPage() {
  const router = useRouter();
  const currentTab = router.query.tab ? Number(router.query.tab) : 0;

  const buttonBar = (
    <div className="flex d-flex ms-auto">
      {currentTab !== 0 && (
        <CreateButton entityLink={TAB_META[currentTab].prependLink} />
      )}
    </div>
  );

  return (
    <PageLayout titleId="managedAttributes" buttonBarContent={buttonBar}>
      <ModuleTabs
        tabs={TABS}
        alertTabIndices={[0]}
        alertOnly={true}
        renderTabContent={(_tab, index) => {
          const meta = TAB_META[index];
          return (
            <ManagedAttributeListView
              apiPath={meta.apiPath}
              prependLink={meta.prependLink}
              componentSupport={meta.componentSupport}
              listKey={meta.titleKey}
            />
          );
        }}
      />
    </PageLayout>
  );
}
