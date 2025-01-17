import { DinaForm } from "common-ui";
import React from "react";
import { mountWithAppContext } from "common-ui";
import { GlobalNamesSearchResult } from "../global-names-search-result-type";
import { GlobalNamesField } from "../GlobalNamesField";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockOnChange = jest.fn((val, form) =>
  form.setFieldValue("scientificNameSource", val ? "GNA" : null)
);

const mockFetchJson = jest.fn(async () => {
  return { names: TEST_GLOBAL_NAME_SEARCH_RESULT };
});

const mockOnSubmit = jest.fn();

describe("GlobalNamesField component", () => {
  beforeEach(jest.clearAllMocks);
  it("Sets a value from the global name API.", async () => {
    const { container } = mountWithAppContext(
      <DinaForm
        initialValues={{ scientificName: "", scientificNameSource: null }}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <GlobalNamesField
          name="scientificName"
          scientificNameSourceField="scientificNameSource"
          scientificNameDetailsField="scientificNameDetails"
          onChange={mockOnChange}
          fetchJson={mockFetchJson}
          dateSupplier={() => "2021-12-16"}
        />
      </DinaForm>
    );

    // Simulate input change for the global name
    const input = container.querySelector("input.global-name-input");
    fireEvent.change(input!, { target: { value: "  monodon  " } });

    await wrapper.waitForRequests();

    // Simulate clicking the search button
    const searchButton = screen.getByRole("button", {
      name: /search/i
    });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const searchResults = screen.getAllByText(
        "Monodontidae: Monodon Linnaeus, 1758"
      );
      expect(searchResults).toHaveLength(1);
    });

    // Simulate selecting a search result
    const selectButton = screen.getByRole("button", {
      name: /select/i
    });
    fireEvent.click(selectButton);

    expect(mockOnChange.mock.calls).toEqual([
      ["  monodon  ", expect.anything()],
      [
        [
          {
            labelHtml: "Monodontidae: Monodon Linnaeus, 1758",
            recordedOn: "2021-12-16",
            sourceUrl: "https://www.catalogueoflife.org/data/taxon/63DDW",
            currentName: "Monodon Linnaeus, 1758",
            isSynonym: false,
            classificationPath:
              "Biota|Animalia|Chordata|Mammalia|Theria|Eutheria|Cetacea|Odontoceti|Monodontidae|Monodon",
            classificationRanks:
              "unranked|kingdom|phylum|class|subclass|infraclass|order|suborder|family|genus"
          },
          expect.anything()
        ],
        expect.anything()
      ]
    ]);

    expect(mockFetchJson).lastCalledWith(
      "https://verifier.globalnames.org/api/v1/verifications/Monodon?capitalize=false"
    );

    // Submit the form
    const form = container.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockOnSubmit).lastCalledWith({
        scientificName: "Monodon Linnaeus, 1758",
        scientificNameSource: "GNA"
      });
    });
  });
});

const TEST_GLOBAL_NAME_SEARCH_RESULT: GlobalNamesSearchResult[] = [
  {
    inputId: "e72d80c5-f421-5705-ac21-a5f6b2b4fb4f",
    input: "Monodon",
    matchType: "Exact",
    bestResult: {
      dataSourceId: 1,
      dataSourceTitleShort: "Catalogue of Life",
      curation: "Curated",
      recordId: "63DDW",
      outlink: "https://www.catalogueoflife.org/data/taxon/63DDW",
      entryDate: "2021-11-20",
      matchedName: "Monodon Linnaeus, 1758",
      matchedCardinality: 1,
      matchedCanonicalSimple: "Monodon",
      matchedCanonicalFull: "Monodon",
      currentRecordId: "63DDW",
      currentName: "Monodon Linnaeus, 1758",
      currentCardinality: 1,
      currentCanonicalSimple: "Monodon",
      currentCanonicalFull: "Monodon",
      isSynonym: false,
      classificationPath:
        "Biota|Animalia|Chordata|Mammalia|Theria|Eutheria|Cetacea|Odontoceti|Monodontidae|Monodon",
      classificationRanks:
        "unranked|kingdom|phylum|class|subclass|infraclass|order|suborder|family|genus",
      classificationIds: "5T6MX|N|CH2|6224G|6226C|LG|WP|62397|CWJ|63DDW",
      editDistance: 0,
      stemEditDistance: 0,
      matchType: "Exact"
    },
    dataSourcesNum: 24,
    curation: "Curated"
  }
];
