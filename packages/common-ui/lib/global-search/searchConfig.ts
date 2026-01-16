import { IconType } from "react-icons";
import {
  FaUser,
  FaFlask,
  FaBox,
  FaWarehouse,
  FaHandshake
} from "react-icons/fa";

export interface IndexConfig {
  name: string;
  indexName: string;
  icon: IconType;
  linkAttribute: string;
  linkPath: string;
  displayAttributes: string[];
}

/**
 * Configuration for all searchable indexes in DINA
 */
export const SEARCH_INDEXES: IndexConfig[] = [
  {
    name: "Material Samples",
    indexName: "dina_material_sample_index",
    icon: FaFlask,
    linkAttribute: "data.attributes.materialSampleName",
    linkPath: "/collection/material-sample/view?id=",
    displayAttributes: [
      "data.attributes.materialSampleName",
      "data.attributes.materialSampleType",
      "data.attributes.group"
    ]
  },
  {
    name: "Stored Objects",
    indexName: "dina_object_store_index",
    icon: FaBox,
    linkAttribute: "data.attributes.originalFilename",
    linkPath: "/object-store/object/view?id=",
    displayAttributes: [
      "data.attributes.originalFilename",
      "data.attributes.acCaption",
      "data.attributes.bucket"
    ]
  },
  {
    name: "Storage Units",
    indexName: "dina_storage_index",
    icon: FaWarehouse,
    linkAttribute: "data.attributes.name",
    linkPath: "/collection/storage-unit/view?id=",
    displayAttributes: ["data.attributes.name", "data.attributes.group"]
  },
  {
    name: "Transactions",
    indexName: "dina_loan_transaction_index",
    icon: FaHandshake,
    linkAttribute: "data.attributes.transactionNumber",
    linkPath: "/loan-transaction/transaction/view?id=",
    displayAttributes: [
      "data.attributes.transactionNumber",
      "data.attributes.materialDirection",
      "data.attributes.group"
    ]
  },
  {
    name: "People",
    indexName: "dina_agent_index",
    icon: FaUser,
    linkAttribute: "data.attributes.displayName",
    linkPath: "/person/view?id=",
    displayAttributes: [
      "data.attributes.displayName",
      "data.attributes.givenNames",
      "data.attributes.familyNames"
    ]
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
