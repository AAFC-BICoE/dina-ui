import { DinaForm } from "../../../../../common-ui/lib";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { CatalogueOfLifeNameField } from "../CatalogueOfLifeNameField";
import { CatalogueOfLifeNameSearchResult } from "../CatalogueOfLifeSearchBox";

const mockOnChange = jest.fn((val, form) =>
  form.setFieldValue("scientificNameSource", val ? "COLPLUS" : null)
);

const mockFetchJson = jest.fn(async () => {
  return EXAMPLE_RESPONSE;
});

const mockOnSubmit = jest.fn();

describe("CatalogueOfLifeNameField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Sets a value from the Catalogue of Life API.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ scientificName: "", scientificNameSource: null }}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <CatalogueOfLifeNameField
          name="scientificName"
          scientificNameSourceField="scientificNameSource"
          onChange={mockOnChange}
          fetchJson={mockFetchJson}
        />
      </DinaForm>
    );

    wrapper
      .find("input.col-search-input")
      .simulate("change", { target: { value: "Poa muralis" } });

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.col-search-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper.find(".col-search-result-label").map(node => node.text())
    ).toEqual([
      "Poa muralis",
      "Poa muralis Wibel, nom. illeg.",
      "Poa muralis Honck."
    ]);

    wrapper.find("button.col-name-select-button").at(1).simulate("click");

    expect(mockOnChange).lastCalledWith(
      "Poa muralis Wibel, nom. illeg.",
      expect.anything()
    );
    expect(mockFetchJson).lastCalledWith(
      "https://api.catalogueoflife.org/nidx/match?q=Poa+muralis&verbose=true"
    );

    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnSubmit).lastCalledWith({
      scientificName: "Poa muralis Wibel, nom. illeg.",
      scientificNameSource: "COLPLUS"
    });
  });

  it("Can remove the value.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          scientificName: "Poa muralis Wibel, nom. illeg.",
          scientificNameSource: "COLPLUS"
        }}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <CatalogueOfLifeNameField
          name="scientificName"
          scientificNameSourceField="scientificNameSource"
          onChange={mockOnChange}
          fetchJson={mockFetchJson}
        />
      </DinaForm>
    );

    // Remove the name:
    wrapper.find("button.remove-button").simulate("click");
    expect(mockOnChange).lastCalledWith(null, expect.anything());
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnSubmit).lastCalledWith({
      scientificName: null,
      scientificNameSource: null
    });
  });
});

const EXAMPLE_RESPONSE: CatalogueOfLifeNameSearchResult = {
  name: {
    created: "2021-03-31T04:16:28.703958",
    modified: "2021-03-31T04:16:28.703958",
    canonicalId: 6488604,
    scientificName: "Poa muralis",
    rank: "species",
    genus: "Poa",
    specificEpithet: "muralis",
    canonical: true,
    labelHtml: "<i>Poa muralis</i>",
    parsed: true,
    id: 6488604
  },
  type: "exact",
  alternatives: [
    {
      created: "2021-03-31T04:16:28.7051",
      modified: "2021-03-31T04:16:28.7051",
      canonicalId: 6488604,
      scientificName: "Poa muralis",
      authorship: "Wibel, nom. illeg.",
      rank: "species",
      genus: "Poa",
      specificEpithet: "muralis",
      combinationAuthorship: {
        authors: ["Wibel"]
      },
      canonical: false,
      labelHtml: "<i>Poa muralis</i> Wibel, nom. illeg.",
      parsed: true,
      id: 6488605
    },
    {
      created: "2021-03-31T04:16:28.717123",
      modified: "2021-03-31T04:16:28.717123",
      canonicalId: 6488604,
      scientificName: "Poa muralis",
      authorship: "Honck.",
      rank: "species",
      genus: "Poa",
      specificEpithet: "muralis",
      combinationAuthorship: {
        authors: ["Honck."]
      },
      canonical: false,
      labelHtml: "<i>Poa muralis</i> Honck.",
      parsed: true,
      id: 6488611
    }
  ],
  nameKey: 6488604
};
