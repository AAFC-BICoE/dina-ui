import { IconType } from "react-icons";
import { FaUser, FaCube } from "react-icons/fa";
import {
  FaBoxesStacked,
  FaDiagramProject,
  FaLocationDot,
  FaRightLeft
} from "react-icons/fa6";
import { MdNature } from "react-icons/md";

export interface IndexConfig {
  name: string;
  indexName: string;
  icon: IconType;
  linkAttribute: string;
  linkPath: string;
}

/**
 * Configuration for all searchable indexes in DINA
 */
export const SEARCH_INDEXES: IndexConfig[] = [
  {
    name: "materialSampleListTitle",
    indexName: "dina_material_sample_index",
    icon: MdNature,
    linkAttribute: "data.attributes.materialSampleName",
    linkPath: "/collection/material-sample/view?id="
  },
  {
    name: "objectListTitle",
    indexName: "dina_object_store_index",
    icon: FaCube,
    linkAttribute: "data.attributes.originalFilename",
    linkPath: "/object-store/object/view?id="
  },
  {
    name: "storageUnitListTitle",
    indexName: "dina_storage_index",
    icon: FaBoxesStacked,
    linkAttribute: "data.attributes.name",
    linkPath: "/collection/storage-unit/view?id="
  },
  {
    name: "projectListTitle",
    indexName: "dina_project_index",
    icon: FaDiagramProject,
    linkAttribute: "data.attributes.name",
    linkPath: "/collection/project/view?id="
  },
  {
    name: "collectingEventListTitle",
    indexName: "dina_collecting_event_index",
    icon: FaLocationDot,
    linkAttribute: "data.attributes.dwcFieldNumber",
    linkPath: "/collection/collecting-event/view?id="
  },
  {
    name: "loanTransactionsSectionTitle",
    indexName: "dina_loan_transaction_index",
    icon: FaRightLeft,
    linkAttribute: "data.attributes.transactionNumber",
    linkPath: "/loan-transaction/transaction/view?id="
  },
  {
    name: "peopleTitle",
    indexName: "dina_agent_index",
    icon: FaUser,
    linkAttribute: "data.attributes.displayName",
    linkPath: "/person/view?id="
  }
];

/**
 * Get index config by index name
 */
export function getIndexConfig(indexName: string): IndexConfig | undefined {
  // Handle timestamped index names (e.g., dina_agent_index_20260105151527)
  return SEARCH_INDEXES.find((config) =>
    indexName.startsWith(config.indexName)
  );
}

/**
 * Get all index names for multi-index search
 */
export function getAllIndexNames(): string[] {
  return SEARCH_INDEXES.map((config) => config.indexName);
}
