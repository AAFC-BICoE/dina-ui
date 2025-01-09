import { DinaForm } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { CatalogueOfLifeNameField } from "../CatalogueOfLifeNameField";
import { NameUsageSearchResult } from "../nameusage-types";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

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
    const { container } = mountWithAppContext(
      <DinaForm
        initialValues={{ scientificName: "", scientificNameSource: null }}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <CatalogueOfLifeNameField
          name="scientificName"
          scientificNameSourceField="scientificNameSource"
          onChange={mockOnChange}
          fetchJson={mockFetchJson}
          dateSupplier={() => "2021-11-09"}
        />
      </DinaForm>
    );

    const input = screen.getByRole("textbox"); // Assuming the input has role "textbox"
    fireEvent.change(input, { target: { value: "  Poa muralis  " } });

    await new Promise(setImmediate);

    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(
        screen.getByRole("link", {
          name: /poa muralis honck\./i
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", {
          name: /poa muralis wibel, nom\. illeg\./i
        })
      ).toBeInTheDocument();
    });

    const selectButton = screen.getAllByRole("button", { name: /select/i });
    fireEvent.click(selectButton[1]);

    expect(mockOnChange).toBeCalledTimes(2);

    expect(mockOnChange.mock.calls).toEqual([
      ["  Poa muralis  ", expect.anything()],
      [
        [
          {
            labelHtml: "<i>Poa muralis</i> Wibel, nom. illeg.",
            recordedOn: "2021-11-09",
            sourceUrl:
              "https://data.catalogueoflife.org/dataset/2328/name/f3d46805-704b-459a-a3f6-58816dad2138"
          },
          expect.anything()
        ],
        expect.anything()
      ]
    ]);

    // The whitespace for the query string should be trimmed:
    expect(mockFetchJson).lastCalledWith(
      "https://api.catalogueoflife.org/dataset/2328/nameusage?q=Poa+muralis"
    );

    const form = container.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockOnSubmit).lastCalledWith({
        scientificName: "Poa muralis Wibel, nom. illeg.",
        scientificNameSource: "COLPLUS"
      });
    });

    // Remove the name:
    const removeButton = screen.getByRole("button", { name: /remove/i });
    fireEvent.click(removeButton);
    expect(mockOnChange).lastCalledWith(null, expect.anything());
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockOnSubmit).lastCalledWith({
        scientificName: null,
        scientificNameSource: null
      });
    });
  });
});

const EXAMPLE_RESPONSE: NameUsageSearchResult = {
  offset: 0,
  limit: 10,
  total: 2,
  result: [
    {
      created: "2021-01-19T21:29:45.536939",
      createdBy: 102,
      modified: "2021-01-19T21:29:45.536939",
      modifiedBy: 102,
      datasetKey: 2328,
      id: "4KMB5",
      sectorKey: 85,
      name: {
        created: "2021-01-19T21:29:45.536939",
        createdBy: 102,
        modified: "2021-01-19T21:29:45.536939",
        modifiedBy: 102,
        datasetKey: 2328,
        id: "bb22f455-9a7b-47f0-8108-292f42a6fefd",
        sectorKey: 85,
        homotypicNameId: "bb22f455-9a7b-47f0-8108-292f42a6fefd",
        scientificName: "Poa muralis",
        authorship: "Honck.",
        rank: "species",
        genus: "Poa",
        specificEpithet: "muralis",
        combinationAuthorship: {
          authors: ["Honck."]
        },
        code: "botanical",
        publishedInId: "370ce65b-44f8-4fc8-9982-106e411314ac",
        origin: "source",
        type: "scientific",
        parsed: true
      },
      status: "synonym",
      origin: "source",
      parentId: "4KMBQ",
      accepted: {
        created: "2021-01-19T21:16:26.153047",
        createdBy: 102,
        modified: "2021-01-19T21:16:26.153047",
        modifiedBy: 102,
        datasetKey: 2328,
        id: "4KMBQ",
        sectorKey: 85,
        name: {
          created: "2021-01-19T21:16:26.153047",
          createdBy: 102,
          modified: "2021-01-19T21:16:26.153047",
          modifiedBy: 102,
          datasetKey: 2328,
          id: "46962c1e-714c-4bdd-afb3-08594a0bfbae",
          sectorKey: 85,
          homotypicNameId: "46962c1e-714c-4bdd-afb3-08594a0bfbae",
          scientificName: "Poa nemoralis",
          authorship: "L.",
          rank: "species",
          genus: "Poa",
          specificEpithet: "nemoralis",
          combinationAuthorship: {
            authors: ["L."]
          },
          code: "botanical",
          publishedInId: "561512ca-d64f-45bc-a416-24da46ec780b",
          origin: "source",
          type: "scientific",
          parsed: true
        },
        status: "accepted",
        origin: "source",
        parentId: "6T8N",
        scrutinizer: "Govaerts R.",
        scrutinizerDate: "2017-08",
        extinct: false,
        label: "Poa nemoralis L.",
        labelHtml: "<i>Poa nemoralis</i> L."
      },
      homotypic: false,
      label: "Poa muralis Honck.",
      labelHtml: "<i>Poa muralis</i> Honck."
    },
    {
      created: "2021-01-19T21:29:23.033685",
      createdBy: 102,
      modified: "2021-01-19T21:29:23.033685",
      modifiedBy: 102,
      datasetKey: 2328,
      id: "4KMB6",
      sectorKey: 85,
      name: {
        created: "2021-01-19T21:29:23.033685",
        createdBy: 102,
        modified: "2021-01-19T21:29:23.033685",
        modifiedBy: 102,
        datasetKey: 2328,
        id: "f3d46805-704b-459a-a3f6-58816dad2138",
        sectorKey: 85,
        homotypicNameId: "f3d46805-704b-459a-a3f6-58816dad2138",
        scientificName: "Poa muralis",
        authorship: "Wibel, nom. illeg.",
        rank: "species",
        genus: "Poa",
        specificEpithet: "muralis",
        combinationAuthorship: {
          authors: ["Wibel"]
        },
        code: "botanical",
        nomStatus: "unacceptable",
        publishedInId: "8fccf819-24c7-4841-a0d7-94544c717e69",
        origin: "source",
        type: "scientific",
        nomenclaturalNote: "nom.illeg.",
        parsed: true
      },
      status: "synonym",
      origin: "source",
      parentId: "4KLK3",
      accepted: {
        created: "2021-01-19T21:16:26.153047",
        createdBy: 102,
        modified: "2021-01-19T21:16:26.153047",
        modifiedBy: 102,
        datasetKey: 2328,
        id: "4KLK3",
        sectorKey: 85,
        name: {
          created: "2021-01-19T21:16:26.153047",
          createdBy: 102,
          modified: "2021-01-19T21:16:26.153047",
          modifiedBy: 102,
          datasetKey: 2328,
          id: "72cb6a0c-1310-4a46-9c0c-6bbaf83203ae",
          sectorKey: 85,
          homotypicNameId: "72cb6a0c-1310-4a46-9c0c-6bbaf83203ae",
          scientificName: "Poa compressa",
          authorship: "L.",
          rank: "species",
          genus: "Poa",
          specificEpithet: "compressa",
          combinationAuthorship: {
            authors: ["L."]
          },
          code: "botanical",
          publishedInId: "561512ca-d64f-45bc-a416-24da46ec780b",
          origin: "source",
          type: "scientific",
          parsed: true
        },
        status: "accepted",
        origin: "source",
        parentId: "6T8N",
        scrutinizer: "Govaerts R.",
        scrutinizerDate: "2017-08",
        extinct: false,
        label: "Poa compressa L.",
        labelHtml: "<i>Poa compressa</i> L."
      },
      homotypic: false,
      label: "Poa muralis Wibel, nom. illeg.",
      labelHtml: "<i>Poa muralis</i> Wibel, nom. illeg."
    }
  ],
  last: true,
  empty: false
};
