import {
  normalizeDatasetExportQuery,
  toDatasetExportSnapshot
} from "../../../../components/collection/dataset/datasetExportUtils";
import { Dataset } from "../../../../types/collection-api";

describe("Dataset export request helpers", () => {
  it("keeps nested search filters and excludes preview-only query options", () => {
    const query = {
      query: {
        bool: {
          must: [
            {
              nested: {
                path: "included",
                query: {
                  term: { "included.attributes.name.keyword": "salmon" }
                }
              }
            }
          ]
        }
      },
      from: 25,
      size: 25,
      sort: [{ createdOn: "desc" }],
      _source: ["data.attributes.materialSampleName"]
    };

    expect(normalizeDatasetExportQuery(query)).toBe(
      JSON.stringify({ query: query.query })
    );
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
