// pages/feedback/home2.tsx (updated)
import { useAccount } from "common-ui";
import { useState, useMemo } from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import { Footer, Head, Nav, CustomizableCardGrid } from "../../components";
import { NavigationCard } from "../../types/common";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { SUPER_USER } from "common-ui/types/DinaRoles";
import Link from "next/link";
import { useLocalStorage } from "@rehooks/local-storage";
import dynamic from "next/dynamic";

import { 
  FaLayerGroup, 
  FaLocationDot, 
  FaBoxArchive, 
  FaBoxesStacked, 
  FaDiagramProject, 
  FaFileCsv,
  FaRightLeft,
  FaLink,
  FaSitemap,
  FaCube,
  FaFileArrowUp,
  FaBuilding,
  FaUser,
  FaBarcode,
  FaFlaskVial,
  FaRoute,
  FaMagnifyingGlassChart,
  FaVials,
  FaDna,
  FaTag,
  FaVectorSquare,
  FaPaperPlane,
  FaIndustry,
  FaTemperatureHalf,
  FaWrench,
  FaPuzzlePiece,
  FaFingerprint,
  FaLandmark,
  FaListCheck,
  FaFileLines,
  FaTags,
  FaFileSignature,
  FaScissors,
  FaUserGear,
  FaUserGroup
} from 'react-icons/fa6';

import { MdNature } from "react-icons/md"; 

// Source of Truth
const COLLECTION_DEFAULTS: NavigationCard[] = [
  { id: "assemblages", title: "title_assemblage", icon: FaLayerGroup, href: "/collection/assemblage/list", category: "collection" },
  { id: "collecting-events", title: "collectingEventListTitle", icon: FaLocationDot, href: "/collection/collecting-event/list", category: "collection" },
  { id: "collections", title: "collectionListTitle", icon: FaBoxArchive, href: "/collection/collection/list", category: "collection" },
  { id: "material-samples", title: "materialSampleListTitle", icon: MdNature, href: "/collection/material-sample/list", category: "collection" },
  { id: "storage-units", title: "storageUnitListTitle", icon: FaBoxesStacked, href: "/collection/storage-unit/list", category: "collection" },
  { id: "projects", title: "projectListTitle", icon: FaDiagramProject, href: "/collection/project/list", category: "collection" },
  { id: "workbook-upload", title: "workbookGroupUploadTitle", icon: FaFileCsv, href: "/workbook/upload", category: "collection" }
];

const TRANSACTION_DEFAULTS: NavigationCard[] = [
  { id: "transactions", title: "transactions", icon: FaRightLeft, href: "/loan-transaction/transaction/list", category: "transactions" }
];

const OBJECT_STORE_DEFAULTS: NavigationCard[] = [
  { id: "external-resources", title: "externalResourceListTitle", icon: FaLink, href: "/object-store/metadata/external-resource-edit", category: "object-store" },
  { id: "object-subtypes", title: "objectSubtypeListTitle", icon: FaSitemap, href: "/object-store/object-subtype/list", category: "object-store" },
  { id: "stored-objects", title: "objectListTitle", icon: FaCube, href: "/object-store/object/list", category: "object-store" },
  { id: "upload-files", title: "uploadPageTitle", icon: FaFileArrowUp, href: "/object-store/upload", category: "object-store" }
];

const AGENT_DEFAULTS: NavigationCard[] = [
  { id: "organizations", title: "organizationListTitle", icon: FaBuilding, href: "/organization/list", category: "agents" },
  { id: "persons", title: "personListTitle", icon: FaUser, href: "/person/list", category: "agents" }
];

const SEQUENCING_DEFAULTS: NavigationCard[] = [
  { id: "index-sets", title: "indexSetListTitle", icon: FaBarcode, href: "/seqdb/index-set/list", category: "sequencing" },
  { id: "library-prep-batches", title: "libraryPrepBatchListTitle", icon: FaFlaskVial, href: "/seqdb/library-prep-batch/list", category: "sequencing" },
  { id: "metagenomics-workflow", title: "metagenomicsWorkflowTitle", icon: FaRoute, href: "/seqdb/metagenomics-workflow/list", category: "sequencing" },
  { id: "molecular-analysis-runs", title: "molecularAnalysisRunListTitle", icon: FaMagnifyingGlassChart, href: "/seqdb/molecular-analysis-run/list", category: "sequencing" },
  { id: "molecular-analysis-workflow", title: "molecularAnalysisWorkflowTitle", icon: FaRoute, href: "/seqdb/molecular-analysis-workflow/list", category: "sequencing" },
  { id: "ngs-workflow", title: "ngsWorkflowWholeGenomeSeqTitle", icon: FaRoute, href: "/seqdb/ngs-workflow/list", category: "sequencing" },
  { id: "ngs-workflow-pooling", title: "ngsWorkflowWholeGenomeSeqPoolingTitle", icon: FaRoute, href: "/seqdb/ngs-workflow-pooling/list", category: "sequencing" },
  { id: "pcr-batches", title: "pcrBatchListTitle", icon: FaVials, href: "/seqdb/pcr-batch/list", category: "sequencing" },
  { id: "pcr-primers", title: "pcrPrimerListTitle", icon: FaDna, href: "/seqdb/pcr-primer/list", category: "sequencing" },
  { id: "pcr-workflows", title: "pcrWorkflowListTitle", icon: FaRoute, href: "/seqdb/pcr-workflow/list", category: "sequencing" },
  { id: "products", title: "productListTitle", icon: FaTag, href: "/seqdb/product/list", category: "sequencing" },
  { id: "regions", title: "regionListTitle", icon: FaVectorSquare, href: "/seqdb/region/list", category: "sequencing" },
  { id: "seq-batches", title: "seqBatchListTitle", icon: FaLayerGroup, href: "/seqdb/seq-batch/list", category: "sequencing" },
  { id: "seq-submission", title: "seqSubmissionListTitle", icon: FaPaperPlane, href: "/seqdb/seq-submission/list", category: "sequencing" },
  { id: "sequencing-facilities", title: "sequencingFacilityListTitle", icon: FaIndustry, href: "/seqdb/sequencing-facility/list", category: "sequencing" },
  { id: "seq-workflows", title: "sangerWorkflowSequencingListTitle", icon: FaRoute, href: "/seqdb/seq-workflow/list", category: "sequencing" },
  { id: "thermocycler-profiles", title: "thermocyclerProfileListTitle", icon: FaTemperatureHalf, href: "/seqdb/thermocycler-profile/list", category: "sequencing" }
];

const CONTROLLED_VOCAB_DEFAULTS: NavigationCard[] = [
  { id: "collection-methods", title: "collectionMethodListTitle", icon: FaWrench, href: "/collection/collection-method/list", category: "controlled-vocabulary" },
  { id: "field-extensions", title: "fieldExtensions", icon: FaPuzzlePiece, href: "/collection/extension/list", category: "controlled-vocabulary" },
  { id: "identifiers", title: "identifiers", icon: FaFingerprint, href: "/identifier/list", category: "controlled-vocabulary" },
  { id: "institutions", title: "institutionListTitle", icon: FaLandmark, href: "/collection/institution/list", category: "controlled-vocabulary" },
  { id: "managed-attributes", title: "managedAttributes", icon: FaListCheck, href: "/managed-attribute/list", category: "controlled-vocabulary" },
  { id: "preparation-methods", title: "title_preparationMethod", icon: FaWrench, href: "/collection/preparation-method/list", category: "controlled-vocabulary" },
  { id: "preparation-types", title: "preparationTypeListTitle", icon: FaTag, href: "/collection/preparation-type/list", category: "controlled-vocabulary" },
  { id: "protocols", title: "protocolListTitle", icon: FaFileLines, href: "/collection/protocol/list", category: "controlled-vocabulary" },
  { id: "storage-unit-types", title: "storageUnitTypeListTitle", icon: FaTags, href: "/collection/storage-unit-type/list", category: "controlled-vocabulary" }
];

function configDefaults(subject: string | undefined): NavigationCard[] {
  return [
    { id: "form-templates", title: "formTemplates", icon: FaFileSignature, href: "/collection/form-template/list", category: "configuration" },
    { id: "split-configurations", title: "splitConfigurationTitle", icon: FaScissors, href: "/collection/split-configuration/list", category: "configuration" },
    {
      id: "user-profile",
      title: "userProfile",
      icon: FaUserGear,
      href: { pathname: `/dina-user/view`, query: { id: subject, hideBackButton: true } },
      category: "configuration"
    }
  ];
}

function managementDefaults(isAdmin?: boolean): NavigationCard[] {
  return [
    { id: "groups", title: "groupListTitle", icon: FaUserGroup, href: "/group/list", category: "management" },
    ...(isAdmin
      ? [
          { id: "users", title: "userListTitle", icon: FaUser, href: "/dina-user/list", category: "management" },
          { id: "report-templates", title: "reportTemplateUpload", icon: FaFileArrowUp, href: "/export/report-template/upload", category: "management" }
        ]
      : [])
  ];
}


function useCardOrder(key: string, defaults: NavigationCard[]) {
  // initial value for localStorage the first time mounting
  const defaultIds = useMemo(() => defaults.map(c => c.id), [defaults]);
  
  // on first render, ids are defaultIds
  // when setIds is called, it writes to localStorage and update state, triggering re-render with new ids
  const [ids, setIds] = useLocalStorage<string[]>(key, defaultIds);

  // rebuild full cards list in saved order

  const cards = useMemo(() => {

  // lookup cards by id
  const byId = new Map(defaults.map(c => [c.id, c]));

  // Prefer the saved order; if `ids` is undefined/null, fall back to default order
  const order = (ids ?? defaultIds);

  // map ids back to full card objects
  return order.map(id => byId.get(id)).filter(Boolean) as NavigationCard[];
}, [ids, defaults, defaultIds]);

  // helper passed to grid component, only ids persist
  const saveFromCards = (next: NavigationCard[]) => setIds(next.map(c => c.id));

  return { cards, saveFromCards };
}


export function Home2() {
  const { isAdmin, rolesPerGroup, subject } = useAccount();

  const showManagementNavigation =
    Object.values(rolesPerGroup ?? {})
      .flatMap((it) => it)
      .includes(SUPER_USER) || isAdmin;

  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const toggleCustomizeMode = () => setIsCustomizeMode((v) => !v);

  // Per-section persistence via useLocalStorage:
  const { cards: collectionCards,            saveFromCards: saveCollection } = useCardOrder("collectionCardsOrder",            COLLECTION_DEFAULTS);
  const { cards: transactionCards,           saveFromCards: saveTransactions } = useCardOrder("transactionCardsOrder",         TRANSACTION_DEFAULTS);
  const { cards: objectStoreCards,           saveFromCards: saveObjectStore } = useCardOrder("objectStoreCardsOrder",          OBJECT_STORE_DEFAULTS);
  const { cards: agentCards,                 saveFromCards: saveAgents } = useCardOrder("agentCardsOrder",                     AGENT_DEFAULTS);
  const { cards: sequencingCards,            saveFromCards: saveSequencing } = useCardOrder("sequencingCardsOrder",            SEQUENCING_DEFAULTS);
  const { cards: controlledVocabularyCards,  saveFromCards: saveControlledVocab } = useCardOrder("controlledVocabularyCardsOrder", CONTROLLED_VOCAB_DEFAULTS);
  const { cards: configurationCards,         saveFromCards: saveConfiguration } = useCardOrder("configurationCardsOrder",      configDefaults(subject));
  const { cards: managementCards,            saveFromCards: saveManagement } = useCardOrder("managementCardsOrder",            managementDefaults(isAdmin));

  return (
    <div>
      <Head title={useDinaIntl().formatMessage("dinaHomeH1")} />
      <Nav />

      <Container fluid={true} className="py-2">
        <div
          className="d-flex justify-content-end"
          style={{ position: "relative", top: "-160px", right: "600px", zIndex: 1000 }}
        >
          <Link href="/" passHref legacyBehavior>
            <Button variant="outline-secondary" size="sm" className="shadow-sm">
              📋 Back to Classic Layout
            </Button>
          </Link>
        </div>
      </Container>

      <main role="main">
        <Container fluid={true}>
          {/* Customize Mode Toggle */}
          <div className="mb-4">
            <Button variant={isCustomizeMode ? "success" : "outline-secondary"} onClick={toggleCustomizeMode}>
              {isCustomizeMode ? "Done" : "Customize"}
            </Button>
          </div>

          {/* Collection */}
          <section className="mb-5">
            <h2 className="mb-4"><DinaMessage id="collectionSectionTitle" /></h2>
            <CustomizableCardGrid
              cards={collectionCards}
              allCards={COLLECTION_DEFAULTS}
              onChange={saveCollection}          // persists IDs immediately
              isCustomizeMode={isCustomizeMode}
            />
          </section>

          {/* Transactions */}
          <section className="mb-5">
            <h2 className="mb-4"><DinaMessage id="loanTransactionsSectionTitle" /></h2>
            <CustomizableCardGrid
              cards={transactionCards}
              allCards={TRANSACTION_DEFAULTS}
              onChange={saveTransactions}
              isCustomizeMode={isCustomizeMode}
            />
          </section>

          {/* Object Store */}
          <section className="mb-5">
            <h2 className="mb-4"><DinaMessage id="objectStoreTitle" /></h2>
            <CustomizableCardGrid
              cards={objectStoreCards}
              allCards={OBJECT_STORE_DEFAULTS}
              onChange={saveObjectStore}
              isCustomizeMode={isCustomizeMode}
            />
          </section>

          {/* Agents */}
          <section className="mb-5">
            <h2 className="mb-4"><DinaMessage id="agentsSectionTitle" /></h2>
            <CustomizableCardGrid
              cards={agentCards}
              allCards={AGENT_DEFAULTS}
              onChange={saveAgents}
              isCustomizeMode={isCustomizeMode}
            />
          </section>

          {/* Sequencing */}
          <section className="mb-5">
            <h2 className="mb-4"><DinaMessage id="seqdbTitle" /></h2>
            <CustomizableCardGrid
              cards={sequencingCards}
              allCards={SEQUENCING_DEFAULTS}
              onChange={saveSequencing}
              isCustomizeMode={isCustomizeMode}
            />
          </section>

          {/* Controlled Vocabulary */}
          <section className="mb-5">
            <h2 className="mb-4"><DinaMessage id="controlledVocabularyTitle" /></h2>
            <CustomizableCardGrid
              cards={controlledVocabularyCards}
              allCards={CONTROLLED_VOCAB_DEFAULTS}
              onChange={saveControlledVocab}
              isCustomizeMode={isCustomizeMode}
            />
          </section>

          {/* Configuration */}
          <section className="mb-5">
            <h2 className="mb-4"><DinaMessage id="dinaConfigurationSectionTitle" /></h2>
            <CustomizableCardGrid
              cards={configurationCards}
              allCards={configDefaults(isAdmin ? subject : undefined)}
              onChange={saveConfiguration}
              isCustomizeMode={isCustomizeMode}
            />
          </section>

          {/* Management (only for super user / admin) */}
          {showManagementNavigation && (
            <section className="mb-5">
              <h2 className="mb-4"><DinaMessage id="dinaManagementSectionTitle" /></h2>
              <CustomizableCardGrid
                cards={managementCards}
                allCards={managementDefaults(isAdmin)}
                onChange={saveManagement}
                isCustomizeMode={isCustomizeMode}
              />
            </section>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}

// Making this page client-only for now to avoid any SSR/localStorage issues
// Will need to be re-enabled for when storing on the server side
export default dynamic(() => Promise.resolve(Home2), { ssr: false }); 
