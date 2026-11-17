import { ESIndexMapping } from "common-ui/lib/list-page/types";
import { generateBuilderConfig } from "common-ui/lib/list-page/query-builder/useQueryBuilderConfig";
import {
  buildDatasetExportQuery,
  toDatasetExportSnapshot
} from "../../../../components/collection/dataset/datasetExportUtils";
import { Dataset } from "../../../../types/collection-api";

const INDEX_MAP: ESIndexMapping[] = [
  {
    label: "materialSampleName",
    value: "data.attributes.materialSampleName",
    type: "text",
    path: "data.attributes",
    hideField: false,
    distinctTerm: false,
    keywordMultiFieldSupport: true,
    keywordNumericSupport: false,
    optimizedPrefix: false,
    containsSupport: false,
    endsWithSupport: false
  }
];

const CONFIG = generateBuilderConfig(
  INDEX_MAP,
  "dina_material_sample_index",
  (message: { id: string }) => message.id
);

const QUERY_TREE = JSON.stringify({
  id: "group-id",
  type: "group",
  children1: [
    {
      type: "rule",
      id: "rule-id",
      properties: {
        field: "data.attributes.materialSampleName",
        operator: "exactMatch",
        value: ["Salmon"],
        valueSrc: ["value"],
        valueType: ["text"],
        valueError: []
      }
    }
  ],
  properties: { conjunction: "AND" }
});

describe("Dataset export request helpers", () => {
  it("converts the stored query tree to the export service's query format", () => {
    const query = buildDatasetExportQuery(QUERY_TREE, CONFIG);

    expect(query).toBeDefined();
    const parsed = JSON.parse(query!);
    expect(parsed.query).toBeDefined();
    expect(JSON.stringify(parsed.query)).toContain("Salmon");
  });

  it("returns undefined when the query or config is missing or invalid", () => {
    expect(buildDatasetExportQuery(undefined, CONFIG)).toBeUndefined();
    expect(buildDatasetExportQuery(QUERY_TREE, undefined)).toBeUndefined();
    expect(buildDatasetExportQuery("not json", CONFIG)).toBeUndefined();
  });

  it("maps the saved dataset resource to the inline export metadata shape", () => {
    const dataset: Dataset = {
      id: "dataset-uuid",
      type: "dataset",
      group: "test-group",
      datasetVersion: "1.1",
      publicationDate: "2026-09-17",
      multilingualTitle: {
        titles: [{ lang: "en", title: "Salmon dataset" }]
      },
      multilingualDescription: {
        descriptions: [{ lang: "en", desc: "Description" }]
      },
      datasetType: "DWCA",
      agentRoles: [{ agent: "agent-uuid", roles: ["creator"] }],
      usageRights: {
        licenseName: "CC-BY",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        usageTerms: "Free to use with attribution."
      },
      keywordSets: [{ keywords: ["Salmo salar"], thesaurus: "GBIF" }],
      coverage: {
        temporal: { beginDate: "2010-01-01", endDate: "2020-12-31" }
      },
      methods: { methodSteps: ["Sequence and align"] },
      project: { title: "Genome survey" }
    };

    expect(toDatasetExportSnapshot(dataset)).toEqual({
      uuid: "dataset-uuid",
      group: "test-group",
      datasetVersion: "1.1",
      publicationDate: "2026-09-17",
      multilingualTitle: {
        titles: [{ lang: "en", title: "Salmon dataset" }]
      },
      multilingualDescription: {
        descriptions: [{ lang: "en", desc: "Description" }]
      },
      datasetType: "DWCA",
      agentRoles: [{ agent: "agent-uuid", roles: ["creator"] }],
      usageRights: {
        licenseName: "CC-BY",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        usageTerms: "Free to use with attribution."
      },
      keywordSets: [{ keywords: ["Salmo salar"], thesaurus: "GBIF" }],
      coverage: {
        temporal: { beginDate: "2010-01-01", endDate: "2020-12-31" }
      },
      methods: { methodSteps: ["Sequence and align"] },
      project: { title: "Genome survey" }
    });
  });
});
