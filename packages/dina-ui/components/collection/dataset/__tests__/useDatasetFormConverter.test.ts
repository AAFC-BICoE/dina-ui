import { License } from "../../../../types/objectstore-api";
import {
  DatasetWithLicense,
  useDatasetFormConverter
} from "../useDatasetFormConverter";

const { convertDatasetToFormData, convertFormDataToDataset } =
  useDatasetFormConverter();

const CC_BY: License = {
  id: "license-1",
  type: "license",
  url: "https://creativecommons.org/licenses/by/4.0/",
  titles: { en: "CC-BY", fr: "CC-BY (fr)" }
};

const FULL_DATASET: DatasetWithLicense = {
  license: CC_BY,
  id: "123",
  type: "dataset",
  group: "test-group",
  datasetVersion: "1.0",
  publicationDate: "2024-05-01",
  datasetType: "DWCA",
  multilingualTitle: {
    titles: [
      { lang: "en", title: "Ants of Canada" },
      { lang: "fr", title: "Fourmis du Canada" }
    ]
  },
  multilingualDescription: {
    descriptions: [{ lang: "en", desc: "A collection of ant specimens." }]
  },
  agentRoles: [{ agent: "agent-uuid-1", roles: ["creator"] }],
  usageRights: {
    licenseName: "CC-BY",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    usageTerms: "Free to use with attribution."
  },
  keywordSets: [
    { keywords: ["ants", "Formicidae"], thesaurus: "GBIF" },
    { keywords: ["Canada"] }
  ],
  coverage: {
    geographic: {
      geographicDescription: "Canada",
      boundingBox: { west: -140, south: 41, east: -52, north: 70 }
    },
    temporal: { beginDate: "2000-01-01", endDate: "2020-12-31" },
    taxonomic: [
      { rank: "kingdom", scientificName: "Animalia", commonName: "Animals" }
    ]
  },
  methods: {
    methodSteps: ["Step one", "Step two"],
    sampling: { studyExtent: "Nationwide", samplingDescription: "Transects" },
    qualityControlDescriptions: ["Verified by a taxonomist"]
  },
  project: {
    title: "Ant Survey",
    abstractText: "Surveying ants.",
    funding: "AAFC",
    studyAreaDescription: "Boreal forest",
    designDescription: "Randomized transects",
    personnel: [{ agent: "agent-uuid-2", roles: ["contact"] }],
    awards: [
      {
        funderName: "AAFC",
        funderIdentifiers: ["funder-1"],
        awardNumber: "A-123",
        title: "Ant Grant",
        awardUrl: "https://example.com/award"
      }
    ]
  }
};

describe("useDatasetFormConverter", () => {
  it("Converts the multilingual fields to the editable dictionary format", () => {
    const formData = convertDatasetToFormData(FULL_DATASET);

    expect(formData.multilingualTitle).toEqual({
      en: "Ants of Canada",
      fr: "Fourmis du Canada"
    });
    expect(formData.multilingualDescription).toEqual({
      en: "A collection of ant specimens."
    });
  });

  it("Hydrates the agent UUIDs into Person objects", () => {
    const formData = convertDatasetToFormData(FULL_DATASET);

    expect(formData.agentRoles).toEqual([
      { agent: { id: "agent-uuid-1", type: "person" }, roles: ["creator"] }
    ]);
    expect(formData.project?.personnel).toEqual([
      { agent: { id: "agent-uuid-2", type: "person" }, roles: ["contact"] }
    ]);
  });

  it("Converts the agent objects back to UUIDs for submission", () => {
    const input = convertFormDataToDataset(
      convertDatasetToFormData(FULL_DATASET)
    );

    expect(input.agentRoles).toEqual([
      { agent: "agent-uuid-1", roles: ["creator"] }
    ]);
    expect(input.project?.personnel).toEqual([
      { agent: "agent-uuid-2", roles: ["contact"] }
    ]);
  });

  it("Round-trips a fully populated dataset without losing anything", () => {
    const input = convertFormDataToDataset(
      convertDatasetToFormData(FULL_DATASET)
    );

    // The client-only license field is dropped; usageRights is derived from it.
    const { license: _license, ...expected } = FULL_DATASET;
    expect(input).toEqual(expected);
  });

  it("Derives the licence name and URL from the selected License", () => {
    const input = convertFormDataToDataset({
      type: "dataset",
      license: CC_BY,
      usageRights: { usageTerms: "Free to use with attribution." }
    });

    expect(input.usageRights).toEqual({
      licenseName: "CC-BY",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      usageTerms: "Free to use with attribution."
    });
  });

  it("Stores the English licence name regardless of the editing locale", () => {
    const input = convertFormDataToDataset({
      type: "dataset",
      license: { ...CC_BY, titles: { fr: "CC-BY (fr)", en: "CC-BY" } }
    });

    expect(input.usageRights?.licenseName).toEqual("CC-BY");
  });

  it("Falls back to the licence URL when the License has no titles", () => {
    const input = convertFormDataToDataset({
      type: "dataset",
      license: { ...CC_BY, titles: {} }
    });

    expect(input.usageRights?.licenseName).toEqual(CC_BY.url);
  });

  it("Clears the stored licence when the dropdown is cleared", () => {
    const formData = convertDatasetToFormData(FULL_DATASET);
    const input = convertFormDataToDataset({ ...formData, license: null });

    expect(input.usageRights).toEqual({
      licenseName: undefined,
      licenseUrl: undefined,
      usageTerms: "Free to use with attribution."
    });
  });

  it("Returns a blank dataset when there is nothing to convert", () => {
    expect(convertDatasetToFormData()).toEqual({ type: "dataset" });
  });

  it("Handles a dataset with no multilingual, agent or project values", () => {
    const input = convertFormDataToDataset(
      convertDatasetToFormData({ id: "1", type: "dataset" })
    );

    expect(input.multilingualTitle).toEqual({ titles: [] });
    expect(input.multilingualDescription).toEqual({ descriptions: [] });
    expect(input.agentRoles).toEqual([]);
    expect(input.project).toBeUndefined();
  });
});
