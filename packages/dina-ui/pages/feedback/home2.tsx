// pages/feedback/home2.tsx (updated)
import { useAccount } from "common-ui";
import { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import { Footer, Head, Nav, CustomizableCardGrid } from "../../components";
import { NavigationCard } from "../../types/common";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { SUPER_USER } from "common-ui/types/DinaRoles";
import Link from "next/link";

// Import all the React Icons
import { 
  FaLayerGroup, 
  FaLocationDot, 
  FaBoxArchive, 
  FaClockRotateLeft, 
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

function applySavedOrder(key: string, cards: NavigationCard[]): NavigationCard[] {
  const saved = localStorage.getItem(key);
  if (!saved) return cards;
  try {
    const ids = JSON.parse(saved) as string[];
    const byId = new Map(cards.map(c => [c.id, c]));
    // Keep only those that still exist:
    const ordered = ids.map(id => byId.get(id)).filter(Boolean) as NavigationCard[];
    // Append any new cards not present when the order was saved:
    for (const c of cards) if (!ids.includes(c.id)) ordered.push(c);
    return ordered;
  } catch {
    console.warn(`Invalid layout data for ${key}`);
    return cards;
  }
}

export function Home2() {
  const { isAdmin, rolesPerGroup, subject } = useAccount();

  const showManagementNavigation =
    Object.values(rolesPerGroup ?? {})
      ?.flatMap((it) => it)
      ?.includes(SUPER_USER) || isAdmin;

  const [isCustomizeMode, setIsCustomizeMode] = useState(false);


function toggleCustomizeMode() {
  if (isCustomizeMode) {
    localStorage.setItem("collectionCardsOrder", JSON.stringify(collectionCards.map(c => c.id)));
    localStorage.setItem("transactionCardsOrder", JSON.stringify(transactionCards.map(c => c.id)));
    localStorage.setItem("objectStoreCardsOrder", JSON.stringify(objectStoreCards.map(c => c.id)));
    localStorage.setItem("agentCardsOrder", JSON.stringify(agentCards.map(c => c.id)));
    localStorage.setItem("sequencingCardsOrder", JSON.stringify(sequencingCards.map(c => c.id)));
    localStorage.setItem("controlledVocabularyCardsOrder", JSON.stringify(controlledVocabularyCards.map(c => c.id)));
    localStorage.setItem("configurationCardsOrder", JSON.stringify(configurationCards.map(c => c.id)));
    localStorage.setItem("managementCardsOrder", JSON.stringify(managementCards.map(c => c.id)));
  }
  setIsCustomizeMode(!isCustomizeMode);
}

  const [collectionCards, setCollectionCards] = useState<NavigationCard[]>([
    {
      id: "assemblages",
      title: "title_assemblage",
      icon: FaLayerGroup,
      href: "/collection/assemblage/list",
      category: "collection"
    },
    {
      id: "collecting-events",
      title: "collectingEventListTitle",
      icon: FaLocationDot,
      href: "/collection/collecting-event/list",
      category: "collection"
    },
    {
      id: "collections",
      title: "collectionListTitle",
      icon: FaBoxArchive,
      href: "/collection/collection/list",
      category: "collection"
    },
    {
      id: "material-samples",
      title: "materialSampleListTitle",
      icon: MdNature,
      href: "/collection/material-sample/list",
      category: "collection"
    },
    {
      id: "storage-units",
      title: "storageUnitListTitle",
      icon: FaBoxesStacked,
      href: "/collection/storage-unit/list",
      category: "collection"
    },
    {
      id: "projects",
      title: "projectListTitle",
      icon: FaDiagramProject,
      href: "/collection/project/list",
      category: "collection"
    },
    {
      id: "workbook-upload",
      title: "workbookGroupUploadTitle",
      icon: FaFileCsv,
      href: "/workbook/upload",
      category: "collection"
    }
  ]);

  const [transactionCards, setTransactionCards] = useState<NavigationCard[]>([
    {
      id: "revisions-by-user-transactions",
      title: "revisionsByUserPageTitle",
      icon: FaClockRotateLeft,
      href: "/loan-transaction/revisions-by-user",
      category: "transactions"
    },
    {
      id: "transactions",
      title: "transactions",
      icon: FaRightLeft,
      href: "/loan-transaction/transaction/list",
      category: "transactions"
    }
  ]);

  const [objectStoreCards, setObjectStoreCards] = useState<NavigationCard[]>([
    {
      id: "external-resources",
      title: "externalResourceListTitle",
      icon: FaLink,
      href: "/object-store/metadata/external-resource-edit",
      category: "object-store"
    },
    {
      id: "object-subtypes",
      title: "objectSubtypeListTitle",
      icon: FaSitemap,
      href: "/object-store/object-subtype/list",
      category: "object-store"
    },
    {
      id: "revisions-by-user-object-store",
      title: "revisionsByUserPageTitle",
      icon: FaClockRotateLeft,
      href: "/object-store/revisions-by-user",
      category: "object-store"
    },
    {
      id: "stored-objects",
      title: "objectListTitle",
      icon: FaCube,
      href: "/object-store/object/list",
      category: "object-store"
    },
    {
      id: "upload-files",
      title: "uploadPageTitle",
      icon: FaFileArrowUp,
      href: "/object-store/upload",
      category: "object-store"
    }
  ]);

  const [agentCards, setAgentCards] = useState<NavigationCard[]>([
    {
      id: "organizations",
      title: "organizationListTitle",
      icon: FaBuilding,
      href: "/organization/list",
      category: "agents"
    },
    {
      id: "persons",
      title: "personListTitle",
      icon: FaUser,
      href: "/person/list",
      category: "agents"
    }
  ]);

  const [sequencingCards, setSequencingCards] = useState<NavigationCard[]>([
    {
      id: "index-sets",
      title: "indexSetListTitle",
      icon: FaBarcode,
      href: "/seqdb/index-set/list",
      category: "sequencing"
    },
    {
      id: "library-prep-batches",
      title: "libraryPrepBatchListTitle",
      icon: FaFlaskVial,
      href: "/seqdb/library-prep-batch/list",
      category: "sequencing"
    },
    {
      id: "metagenomics-workflow",
      title: "metagenomicsWorkflowTitle",
      icon: FaRoute,
      href: "/seqdb/metagenomics-workflow/list",
      category: "sequencing"
    },
    {
      id: "molecular-analysis-runs",
      title: "molecularAnalysisRunListTitle",
      icon: FaMagnifyingGlassChart,
      href: "/seqdb/molecular-analysis-run/list",
      category: "sequencing"
    },
    {
      id: "molecular-analysis-workflow",
      title: "molecularAnalysisWorkflowTitle",
      icon: FaRoute,
      href: "/seqdb/molecular-analysis-workflow/list",
      category: "sequencing"
    },
    {
      id: "ngs-workflow",
      title: "ngsWorkflowWholeGenomeSeqTitle",
      icon: FaRoute,
      href: "/seqdb/ngs-workflow/list",
      category: "sequencing"
    },
    {
      id: "ngs-workflow-pooling",
      title: "ngsWorkflowWholeGenomeSeqPoolingTitle",
      icon: FaRoute,
      href: "/seqdb/ngs-workflow-pooling/list",
      category: "sequencing"
    },
    {
      id: "pcr-batches",
      title: "pcrBatchListTitle",
      icon: FaVials,
      href: "/seqdb/pcr-batch/list",
      category: "sequencing"
    },
    {
      id: "pcr-primers",
      title: "pcrPrimerListTitle",
      icon: FaDna,
      href: "/seqdb/pcr-primer/list",
      category: "sequencing"
    },
    {
      id: "pcr-workflows",
      title: "pcrWorkflowListTitle",
      icon: FaRoute,
      href: "/seqdb/pcr-workflow/list",
      category: "sequencing"
    },
    {
      id: "products",
      title: "productListTitle",
      icon: FaTag,
      href: "/seqdb/product/list",
      category: "sequencing"
    },
    {
      id: "regions",
      title: "regionListTitle",
      icon: FaVectorSquare,
      href: "/seqdb/region/list",
      category: "sequencing"
    },
    {
      id: "seq-batches",
      title: "seqBatchListTitle",
      icon: FaLayerGroup,
      href: "/seqdb/seq-batch/list",
      category: "sequencing"
    },
    {
      id: "seq-submission",
      title: "seqSubmissionListTitle",
      icon: FaPaperPlane,
      href: "/seqdb/seq-submission/list",
      category: "sequencing"
    },
    {
      id: "sequencing-facilities",
      title: "sequencingFacilityListTitle",
      icon: FaIndustry,
      href: "/seqdb/sequencing-facility/list",
      category: "sequencing"
    },
    {
      id: "seq-workflows",
      title: "sangerWorkflowSequencingListTitle",
      icon: FaRoute,
      href: "/seqdb/seq-workflow/list",
      category: "sequencing"
    },
    {
      id: "thermocycler-profiles",
      title: "thermocyclerProfileListTitle",
      icon: FaTemperatureHalf,
      href: "/seqdb/thermocycler-profile/list",
      category: "sequencing"
    }
  ]);

  const [controlledVocabularyCards, setControlledVocabularyCards] = useState<NavigationCard[]>([
    {
      id: "collection-methods",
      title: "collectionMethodListTitle",
      icon: FaWrench,
      href: "/collection/collection-method/list",
      category: "controlled-vocabulary"
    },
    {
      id: "field-extensions",
      title: "fieldExtensions",
      icon: FaPuzzlePiece,
      href: "/collection/extension/list",
      category: "controlled-vocabulary"
    },
    {
      id: "identifiers",
      title: "identifiers",
      icon: FaFingerprint,
      href: "/identifier/list",
      category: "controlled-vocabulary"
    },
    {
      id: "institutions",
      title: "institutionListTitle",
      icon: FaLandmark,
      href: "/collection/institution/list",
      category: "controlled-vocabulary"
    },
    {
      id: "managed-attributes",
      title: "managedAttributes",
      icon: FaListCheck,
      href: "/managed-attribute/list",
      category: "controlled-vocabulary"
    },
    {
      id: "preparation-methods",
      title: "title_preparationMethod",
      icon: FaWrench,
      href: "/collection/preparation-method/list",
      category: "controlled-vocabulary"
    },
    {
      id: "preparation-types",
      title: "preparationTypeListTitle",
      icon: FaTag,
      href: "/collection/preparation-type/list",
      category: "controlled-vocabulary"
    },
    {
      id: "protocols",
      title: "protocolListTitle",
      icon: FaFileLines,
      href: "/collection/protocol/list",
      category: "controlled-vocabulary"
    },
    {
      id: "storage-unit-types",
      title: "storageUnitTypeListTitle",
      icon: FaTags,
      href: "/collection/storage-unit-type/list",
      category: "controlled-vocabulary"
    }
  ]);

  const [configurationCards, setConfigurationCards] = useState<NavigationCard[]>([
    {
      id: "form-templates",
      title: "formTemplates",
      icon: FaFileSignature,
      href: "/collection/form-template/list",
      category: "configuration"
    },
    {
      id: "split-configurations",
      title: "splitConfigurationTitle",
      icon: FaScissors,
      href: "/collection/split-configuration/list",
      category: "configuration"
    },
    {
      id: "user-profile",
      title: "userProfile",
      icon: FaUserGear,
      href: {
        pathname: `/dina-user/view`,
        query: {
          id: subject,
          hideBackButton: true
        }
      },
      category: "configuration"
    }
  ]);

  const [managementCards, setManagementCards] = useState<NavigationCard[]>([
    {
      id: "groups",
      title: "groupListTitle",
      icon: FaUserGroup,
      href: "/group/list",
      category: "management"
    },
    ...(isAdmin ? [
      {
        id: "users",
        title: "userListTitle",
        icon: FaUser,
        href: "/dina-user/list",
        category: "management"
      },
      {
        id: "report-templates",
        title: "reportTemplateUpload",
        icon: FaFileArrowUp,
        href: "/export/report-template/upload",
        category: "management"
      }
    ] : [])
  ]);

  useEffect(() => {
    setCollectionCards(prev => applySavedOrder("collectionCardsOrder", prev));
    setTransactionCards(prev => applySavedOrder("transactionCardsOrder", prev));
    setObjectStoreCards(prev => applySavedOrder("objectStoreCardsOrder", prev));
    setAgentCards(prev => applySavedOrder("agentCardsOrder", prev));
    setSequencingCards(prev => applySavedOrder("sequencingCardsOrder", prev));
    setControlledVocabularyCards(prev => applySavedOrder("controlledVocabularyCardsOrder", prev));
    setConfigurationCards(prev => applySavedOrder("configurationCardsOrder", prev));
    setManagementCards(prev => applySavedOrder("managementCardsOrder", prev));
  }, []);   

  return (
    <div>
      <Head title={useDinaIntl().formatMessage("dinaHomeH1")} />
      <Nav />
      
      <Container fluid={true} className="py-2">
        <div className="d-flex justify-content-end"
        style={{
            position: 'relative',
            top: '-160px',
            right: '600px',
            zIndex: 1000
        }}
        >
        <Link href="/" passHref legacyBehavior>
            <Button 
            variant="outline-secondary" 
            size="sm"
            className="shadow-sm"
            >
            📋 Back to Classic Layout
            </Button>
        </Link>
        </div>
      </Container>

      <main role="main">
        <Container fluid={true}>

          {/* Customize Mode Toggle */}
          <div className="mb-4">
            <Button
              variant={isCustomizeMode ? "success" : "outline-secondary"}
              onClick={toggleCustomizeMode}
            >
              {isCustomizeMode ? "Done" : "Customize"}
            </Button>
          </div>

          {/* Collection Section */}
          <section className="mb-5">
            <h2 className="mb-4">
              <DinaMessage id="collectionSectionTitle" />
            </h2>
              <CustomizableCardGrid initialCards={collectionCards} onSave={setCollectionCards} isCustomizeMode={isCustomizeMode} />
          </section>

          {/* Transaction Section */}
          <section className="mb-5">
            <h2 className="mb-4">
              <DinaMessage id="loanTransactionsSectionTitle" />
            </h2>
            <CustomizableCardGrid initialCards={transactionCards} onSave={setTransactionCards} isCustomizeMode={isCustomizeMode} />
          </section>

          {/* Object Store Section */}
          <section className="mb-5">
            <h2 className="mb-4">
              <DinaMessage id="objectStoreTitle" />
            </h2>
            <CustomizableCardGrid initialCards={objectStoreCards} onSave={setObjectStoreCards} isCustomizeMode={isCustomizeMode} />
          </section>

          {/* Agents Section */}
          <section className="mb-5">
            <h2 className="mb-4">
              <DinaMessage id="agentsSectionTitle" />
            </h2>
            <CustomizableCardGrid initialCards={agentCards} onSave={setAgentCards} isCustomizeMode={isCustomizeMode} />
          </section>

          {/* Sequencing Section */}
          <section className="mb-5">
            <h2 className="mb-4">
              <DinaMessage id="seqdbTitle" />
            </h2>
            <CustomizableCardGrid initialCards={sequencingCards} onSave={setSequencingCards} isCustomizeMode={isCustomizeMode} />
          </section>

          {/* Controlled Vocabulary Section */}
          <section className="mb-5">
            <h2 className="mb-4">
              <DinaMessage id="controlledVocabularyTitle" />
            </h2>
            <CustomizableCardGrid initialCards={controlledVocabularyCards} onSave={setControlledVocabularyCards} isCustomizeMode={isCustomizeMode} />
          </section>

          {/* Configuration Section */}
          <section className="mb-5">
            <h2 className="mb-4">
              <DinaMessage id="dinaConfigurationSectionTitle" />
            </h2>
            <CustomizableCardGrid initialCards={configurationCards} onSave={setConfigurationCards} isCustomizeMode={isCustomizeMode} />
          </section>

          {/* Management Section - Only visible to collection managers/admins */}
          {showManagementNavigation && (
            <section className="mb-5">
              <h2 className="mb-4">
                <DinaMessage id="dinaManagementSectionTitle" />
              </h2>
              <CustomizableCardGrid initialCards={managementCards} onSave={setManagementCards} isCustomizeMode={isCustomizeMode} />
            </section>
          )}

        </Container>
      </main>
      <Footer />
    </div>
  );
}

export default Home2;