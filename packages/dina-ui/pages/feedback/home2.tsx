// pages/feedback/home2.tsx (updated)
import { useAccount } from "common-ui";
import { useState, useMemo } from "react";
import Container from "react-bootstrap/Container";
import { Footer, Head, Nav, CustomizableSectionGrid, UIPreferenceHook } from "../../components";
import { NavigationCard } from "../../types/common";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { SUPER_USER } from "common-ui/types/DinaRoles";

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
  FaUserGroup,
} from "react-icons/fa6";

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

export function Home2() {
  const { isAdmin, rolesPerGroup, subject } = useAccount();

  const showManagementNavigation =
    Object.values(rolesPerGroup ?? {})
      .flatMap((it) => it)
      .includes(SUPER_USER) || isAdmin;

  const [isCustomizeMode, setIsCustomizeMode] = useState(false);

  // Compute dynamic defaults (depend on subject/isAdmin):
  const configurationDefaults = useMemo(() => configDefaults(subject), [subject]);
  const management = useMemo(() => managementDefaults(isAdmin), [isAdmin]);

  // Build one object with all sections so the hook can initialize in one PATCH/POST:
  const sections = useMemo(
    () => ({
      collectionCardsOrder: COLLECTION_DEFAULTS,
      transactionCardsOrder: TRANSACTION_DEFAULTS,
      objectStoreCardsOrder: OBJECT_STORE_DEFAULTS,
      agentCardsOrder: AGENT_DEFAULTS,
      sequencingCardsOrder: SEQUENCING_DEFAULTS,
      controlledVocabularyCardsOrder: CONTROLLED_VOCAB_DEFAULTS,
      configurationCardsOrder: configurationDefaults,
      managementCardsOrder: management
    }),
    [configurationDefaults, management]
  );

  const { getCards, saveCards, getSectionOrder, saveSectionOrder, loading } = UIPreferenceHook(sections);

  const sectionConfigs = [
    {
      id: "collectionCardsOrder",
      title: <DinaMessage id="collectionSectionTitle" />,
      gridProps: {
        cards: getCards("collectionCardsOrder"),
        allCards: COLLECTION_DEFAULTS,
        onChange: next => saveCards("collectionCardsOrder", next),
        isCustomizeMode
      }
    },
    {
      id: "transactionCardsOrder",
      title: <DinaMessage id="loanTransactionsSectionTitle" />,
      gridProps: {
        cards: getCards("transactionCardsOrder"),
        allCards: TRANSACTION_DEFAULTS,
        onChange: next => saveCards("transactionCardsOrder", next),
        isCustomizeMode
      }
    },
    {
      id: "objectStoreCardsOrder",
      title: <DinaMessage id="objectStoreTitle" />,
      gridProps: {
        cards: getCards("objectStoreCardsOrder"),
        allCards: OBJECT_STORE_DEFAULTS,
        onChange: next => saveCards("objectStoreCardsOrder", next),
        isCustomizeMode
      }
    },
    {
      id: "agentCardsOrder",
      title: <DinaMessage id="agentsSectionTitle" />,
      gridProps: {
        cards: getCards("agentCardsOrder"),
        allCards: AGENT_DEFAULTS,
        onChange: next => saveCards("agentCardsOrder", next),
        isCustomizeMode
      }
    },
    {
      id: "sequencingCardsOrder",
      title: <DinaMessage id="seqdbTitle" />,
      gridProps: {
        cards: getCards("sequencingCardsOrder"),
        allCards: SEQUENCING_DEFAULTS,
        onChange: next => saveCards("sequencingCardsOrder", next),
        isCustomizeMode
      }
    },
    {
      id: "controlledVocabularyCardsOrder",
      title: <DinaMessage id="controlledVocabularyTitle" />,
      gridProps: {
        cards: getCards("controlledVocabularyCardsOrder"),
        allCards: CONTROLLED_VOCAB_DEFAULTS,
        onChange: next => saveCards("controlledVocabularyCardsOrder", next),
        isCustomizeMode
      }
    },
    {
      id: "configurationCardsOrder",
      title: <DinaMessage id="dinaConfigurationSectionTitle" />,
      gridProps: {
        cards: getCards("configurationCardsOrder"),
        allCards: configurationDefaults,
        onChange: next => saveCards("configurationCardsOrder", next),
        isCustomizeMode
      }
    },
    ...(showManagementNavigation
      ? [{
          id: "managementCardsOrder",
          title: <DinaMessage id="dinaManagementSectionTitle" />,
          gridProps: {
            cards: getCards("managementCardsOrder"),
            allCards: management,
            onChange: next => saveCards("managementCardsOrder", next),
            isCustomizeMode
          }
        }]
      : [])
  ];

  if (loading) {
    return <div>Loading preferences...</div>;
  }

   // === Apply saved section order to the UI ===
   // 1) Default order is whatever order we built the configs in:
   const defaultOrder = sectionConfigs.map(s => s.id);
   // 2) Ask the hook for the saved order (or fall back to default on first run):
   const savedOrder = getSectionOrder ? getSectionOrder(defaultOrder) : defaultOrder;
   // 3) Derive the actual render list in the saved order (ignore unknown keys defensively):
   const orderedSectionConfigs = savedOrder
     .map(id => sectionConfigs.find(s => s.id === id))
     .filter(Boolean) as typeof sectionConfigs;

  return (
    <div>
      <Head title={useDinaIntl().formatMessage("dinaHomeH1")} />
        <Nav
          isCustomizeMode={isCustomizeMode}
          setIsCustomizeMode={setIsCustomizeMode}
        />
      <main role="main">
        <Container fluid>
          <CustomizableSectionGrid
             sections={orderedSectionConfigs}
            // Persist immediately when the DND order changes:
             onSectionOrderChange={(nextOrder) => saveSectionOrder(nextOrder.map(s => s.id))}
             isCustomizeMode={isCustomizeMode}
          />
        </Container>
      </main>
      <Footer />
    </div>
  );
}

export default Home2; 
