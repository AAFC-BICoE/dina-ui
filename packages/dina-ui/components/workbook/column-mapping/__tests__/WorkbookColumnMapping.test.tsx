import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mountWithAppContext } from "common-ui";
import { useEffect } from "react";
import "@testing-library/jest-dom";
import { COLLECTION_OTHER_IDENTIFIERS_ID } from "../../../controlled-vocabulary/controlledVocabularyItemUtils";
import db from "../../WorkbookDB";
import {
  useWorkbookContext,
  WorkbookUploadContextProvider
} from "../../WorkbookProvider";
import { WorkbookJSON } from "../../types/Workbook";
import { WorkbookColumnMapping } from "../WorkbookColumnMapping";

jest.mock("../../WorkbookDB", () => ({
  __esModule: true,
  default: {
    workbooks: {
      get: jest.fn(async () => undefined),
      put: jest.fn(),
      add: jest.fn(),
      clear: jest.fn()
    }
  }
}));

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn(), pathname: "/workbook/upload" })
}));

const COLLECTIONS = [
  { id: "collection-a", type: "collection", name: "Collection A" },
  { id: "collection-b", type: "collection", name: "Collection B" }
];

const PERSONS = [
  { id: "person-a", type: "person", displayName: "Person A" },
  { id: "person-b", type: "person", displayName: "Person B" },
  { id: "person-cardinal", type: "person", displayName: "Cardinal, Sophie" },
  {
    id: "person-van-der-berg",
    type: "person",
    displayName: "van der Berg, Anna"
  }
];

const MANAGED_ATTRIBUTES = [
  {
    id: "incubation-date",
    type: "controlled-vocabulary-item",
    name: "Incubation Date",
    key: "incubation_date",
    dinaComponent: "PREPARATION",
    vocabularyElementType: "DATE"
  },
  {
    id: "inoculation-date",
    type: "controlled-vocabulary-item",
    name: "Inoculation Date",
    // The generated key differs from the column path (inoculation_date).
    key: "inoculation_date_date",
    dinaComponent: "PREPARATION",
    vocabularyElementType: "DATE"
  }
];

const IDENTIFIERS = [
  {
    id: "tube-id",
    type: "controlled-vocabulary-item",
    name: "Tube ID",
    key: "tube_id"
  }
];

const TAXONOMIC_RANKS = [{ key: "genus", name: "genus" }];

/** Returned by the duplicate check, which filters by collection. */
let existingMaterialSampleNames: string[] = [];
/** Returned by the parent lookup, which filters by group. */
let parentMaterialSampleNames: string[] = [];

/** Answers a material-sample lookup with the given names that the filter asks for. */
function findMaterialSamples(names: string[], filter: any) {
  const requested = filter?.materialSampleName?.IN
    ? String(filter.materialSampleName.IN).split(",")
    : [filter?.materialSampleName?.EQ];
  return names
    .filter((name) => requested.includes(name))
    .map((name) => ({
      id: `id-${name}`,
      type: "material-sample",
      materialSampleName: name
    }));
}

function getMaterialSampleFilters(filterField: "group" | "collection.uuid") {
  return mockGet.mock.calls
    .filter(
      ([path, params]) =>
        path === "collection-api/material-sample" &&
        params?.filter?.[filterField]
    )
    .map(([, params]) => params.filter);
}

const mockGet = jest.fn(async (path: string, params?: any) => {
  if (
    path.includes("resource-name-identifier") &&
    path.includes("filter[type][EQ]=collection")
  ) {
    return { data: COLLECTIONS };
  }
  if (path === "agent-api/person") {
    return { data: PERSONS };
  }
  if (path === "collection-api/controlled-vocabulary-item") {
    const isIdentifierQuery = JSON.stringify(params?.filter).includes(
      COLLECTION_OTHER_IDENTIFIERS_ID
    );
    return { data: isIdentifierQuery ? IDENTIFIERS : MANAGED_ATTRIBUTES };
  }
  if (path === "collection-api/vocabulary2/taxonomicRank") {
    return { data: { vocabularyElements: TAXONOMIC_RANKS } };
  }
  if (path === "collection-api/material-sample") {
    return {
      data: findMaterialSamples(
        params?.filter?.["collection.uuid"]
          ? existingMaterialSampleNames
          : parentMaterialSampleNames,
        params?.filter
      )
    };
  }
  return { data: [] };
});

const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: jest.fn(async () => [])
};

function createSpreadsheet(rows: string[][]): WorkbookJSON {
  return {
    0: {
      sheetName: "Sheet1",
      rows: rows.map((content, rowNumber) => ({ rowNumber, content }))
    }
  };
}

function createCollectionSpreadsheet(collectionHeader: string) {
  return createSpreadsheet([
    ["Primary ID", collectionHeader],
    ["S-1", "Spreadsheet Collection"],
    ["S-2", "Spreadsheet Collection"]
  ]);
}

function UploadSpreadsheet({ spreadsheet }: { spreadsheet: WorkbookJSON }) {
  const { uploadWorkbook, spreadsheetData } = useWorkbookContext();
  useEffect(() => {
    uploadWorkbook(spreadsheet);
  }, []);
  return spreadsheetData ? (
    <WorkbookColumnMapping performSave={false} setPerformSave={jest.fn()} />
  ) : null;
}

async function renderColumnMapping(spreadsheet: WorkbookJSON) {
  mountWithAppContext(
    <WorkbookUploadContextProvider>
      <UploadSpreadsheet spreadsheet={spreadsheet} />
    </WorkbookUploadContextProvider>,
    { apiContext }
  );
  await screen.findByText("Column Mapping");
}

async function findColumnMappingRow(columnHeader: string) {
  const headerCell = await screen.findByText(columnHeader, {
    selector: ".col-md-4"
  });
  return headerCell.closest(".row") as HTMLElement;
}

async function findRelationshipRow(value: string) {
  const valueCell = await screen.findByText(value, { selector: ".col-2" });
  return valueCell.closest(".row") as HTMLElement;
}

async function mapColumnToCollectionName(columnHeader: string) {
  const mappingRow = await findColumnMappingRow(columnHeader);
  await userEvent.type(within(mappingRow).getByRole("combobox"), "collection");

  const collectionGroup = Array.from(
    document.querySelectorAll("[id*='-heading']")
  ).find((heading) => heading.textContent === "Collection") as HTMLElement;
  await userEvent.click(
    within(collectionGroup.parentElement as HTMLElement).getByText("Name")
  );
}

async function selectRelatedRecord(value: string, relatedRecord: string) {
  const row = await findRelationshipRow(value);
  await userEvent.click(within(row).getByRole("combobox"));
  await userEvent.click(await screen.findByText(relatedRecord));
}

async function skipColumn(columnHeader: string) {
  const mappingRow = await findColumnMappingRow(columnHeader);
  await userEvent.click(within(mappingRow).getByRole("checkbox"));
}

function getSelectedValue(row: HTMLElement) {
  return row.querySelector("[class*='singleValue']")?.textContent;
}

async function submitForm() {
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
}

async function findErrorMessage(message: RegExp) {
  return within(await screen.findByRole("status")).findByText(message);
}

function getSavedResources(): any[] | undefined {
  return (db.workbooks.add as jest.Mock).mock.calls[0]?.[0]?.workbook;
}

async function waitForSavedResources() {
  await waitFor(() => expect(db.workbooks.add).toHaveBeenCalledTimes(1));
  return getSavedResources()!;
}

describe("WorkbookColumnMapping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    existingMaterialSampleNames = [];
    parentMaterialSampleNames = [];
  });

  describe("relationship mapping", () => {
    it("keeps the selected related record for an automatically mapped column", async () => {
      await renderColumnMapping(createCollectionSpreadsheet("Collection"));

      await selectRelatedRecord("Spreadsheet Collection", "Collection B");

      await waitFor(async () =>
        expect(
          getSelectedValue(await findRelationshipRow("Spreadsheet Collection"))
        ).toEqual("Collection B")
      );
    });

    it("automatically maps a Collection Name column", async () => {
      await renderColumnMapping(createCollectionSpreadsheet("Collection Name"));

      await waitFor(async () =>
        expect(
          getSelectedValue(await findColumnMappingRow("Collection Name"))
        ).toEqual("Name")
      );
      expect(
        await findRelationshipRow("Spreadsheet Collection")
      ).toBeInTheDocument();
    });

    it.each([
      [
        "with the generated column path",
        "Collection Name",
        ["collection.name"]
      ],
      ["without a generated column path", "collection.name", undefined]
    ])(
      "shows the spreadsheet header %s",
      async (_description, header, originalColumns) => {
        await renderColumnMapping({
          0: {
            sheetName: "Sheet1",
            originalColumns,
            rows: [
              { rowNumber: 0, content: [header] },
              { rowNumber: 1, content: ["Spreadsheet Collection"] }
            ]
          }
        });

        const row = await findRelationshipRow("Spreadsheet Collection");
        expect(within(row).getByText(header)).toBeInTheDocument();
        expect(within(row).queryByText("collection_name")).toBeNull();
      }
    );

    it("keeps a column mapping that was selected manually", async () => {
      await renderColumnMapping(
        createCollectionSpreadsheet("Owning Collection")
      );

      await mapColumnToCollectionName("Owning Collection");

      await waitFor(async () =>
        expect(
          getSelectedValue(await findColumnMappingRow("Owning Collection"))
        ).toEqual("Name")
      );
      expect(
        await findRelationshipRow("Spreadsheet Collection")
      ).toBeInTheDocument();
    });

    it("keeps the selected related record and the manual column mapping", async () => {
      await renderColumnMapping(
        createCollectionSpreadsheet("Owning Collection")
      );

      await mapColumnToCollectionName("Owning Collection");
      await selectRelatedRecord("Spreadsheet Collection", "Collection B");

      await waitFor(async () =>
        expect(
          getSelectedValue(await findRelationshipRow("Spreadsheet Collection"))
        ).toEqual("Collection B")
      );
      expect(
        getSelectedValue(await findColumnMappingRow("Owning Collection"))
      ).toEqual("Name");
    });
  });

  describe("managed attributes", () => {
    it.each([
      ["Incubation Date", "incubation_date"],
      ["Inoculation Date", "inoculation_date"]
    ])(
      "automatically selects the %s preparation managed attribute",
      async (header, key) => {
        await renderColumnMapping({
          0: {
            sheetName: "Sheet1",
            originalColumns: [`preparationManagedAttributes.${key}`],
            rows: [
              { rowNumber: 0, content: [header] },
              { rowNumber: 1, content: ["2019-09-24"] }
            ]
          }
        });

        const mappingRow = await findColumnMappingRow(header);
        await waitFor(() =>
          expect(
            Array.from(
              mappingRow.querySelectorAll("[class*='singleValue']")
            ).map((value) => value.textContent)
          ).toEqual(["Preparation Managed Attributes", header])
        );
      }
    );
  });

  describe("other identifiers", () => {
    it("automatically selects an other identifier by the header's name", async () => {
      await renderColumnMapping({
        0: {
          sheetName: "Sheet1",
          originalColumns: ["managedAttributes.tube_id"],
          rows: [
            { rowNumber: 0, content: ["Tube ID"] },
            { rowNumber: 1, content: ["M_MMK2_h_0"] }
          ]
        }
      });

      const mappingRow = await findColumnMappingRow("Tube ID");
      await waitFor(() =>
        expect(
          Array.from(mappingRow.querySelectorAll("[class*='singleValue']")).map(
            (value) => value.textContent
          )
        ).toEqual(["Other Identifiers", "Tube ID"])
      );
    });
  });

  describe("multiple agents in a cell", () => {
    function createCollectorsSpreadsheet(collectors: string) {
      return createSpreadsheet([
        ["Primary ID", "Collectors"],
        ["S-1", collectors],
        ["S-2", "Person A"]
      ]);
    }

    it("displays each agent as a separate relationship row", async () => {
      await renderColumnMapping(
        createCollectorsSpreadsheet("Person A; Person B; Unknown Org")
      );

      const personARow = await findRelationshipRow("Person A");
      const personBRow = await findRelationshipRow("Person B");
      const unknownRow = await findRelationshipRow("Unknown Org");

      expect(
        screen.queryByText("Person A; Person B; Unknown Org", {
          selector: ".col-2"
        })
      ).toBeNull();
      expect(within(personARow).getByText("2")).toBeInTheDocument();
      expect(within(personBRow).getByText("1")).toBeInTheDocument();
      expect(within(unknownRow).getByText("1")).toBeInTheDocument();

      // Each agent is matched to an individual person
      await waitFor(() => {
        expect(getSelectedValue(personARow)).toEqual("Person A");
        expect(getSelectedValue(personBRow)).toEqual("Person B");
      });
      expect(getSelectedValue(unknownRow)).toBeUndefined();
    });

    it("keeps a 'Last, First' name and splits comma separated names", async () => {
      await renderColumnMapping(
        createCollectorsSpreadsheet("Cardinal, Sophie; Person A, Person B")
      );

      const cardinalRow = await findRelationshipRow("Cardinal, Sophie");
      const personARow = await findRelationshipRow("Person A");
      const personBRow = await findRelationshipRow("Person B");

      expect(screen.queryByText("Cardinal", { selector: ".col-2" })).toBeNull();
      expect(screen.queryByText("Sophie", { selector: ".col-2" })).toBeNull();
      expect(within(cardinalRow).getByText("1")).toBeInTheDocument();
      expect(within(personARow).getByText("2")).toBeInTheDocument();
      expect(within(personBRow).getByText("1")).toBeInTheDocument();

      await waitFor(() => {
        expect(getSelectedValue(cardinalRow)).toEqual("Cardinal, Sophie");
        expect(getSelectedValue(personARow)).toEqual("Person A");
        expect(getSelectedValue(personBRow)).toEqual("Person B");
      });
    });

    it("keeps an existing person with a comma in their name as a single row", async () => {
      await renderColumnMapping(
        createCollectorsSpreadsheet("van der Berg, Anna; Person B")
      );

      const vanDerBergRow = await findRelationshipRow("van der Berg, Anna");

      expect(
        screen.queryByText("van der Berg", { selector: ".col-2" })
      ).toBeNull();
      expect(screen.queryByText("Anna", { selector: ".col-2" })).toBeNull();
      await waitFor(() =>
        expect(getSelectedValue(vanDerBergRow)).toEqual("van der Berg, Anna")
      );
    });

    it("does not warn when every comma separated agent is mapped", async () => {
      await renderColumnMapping(
        createCollectorsSpreadsheet("Cardinal, Sophie; Person A, Person B")
      );
      await waitFor(async () =>
        expect(
          getSelectedValue(await findRelationshipRow("Cardinal, Sophie"))
        ).toEqual("Cardinal, Sophie")
      );

      await submitForm();

      await waitForSavedResources();
      expect(screen.queryByText("Unmapped Relationships")).toBeNull();
    });

    it("warns when an agent in the cell is not mapped", async () => {
      await renderColumnMapping(
        createCollectorsSpreadsheet("Person A; Unknown Org")
      );
      await findRelationshipRow("Unknown Org");

      await submitForm();

      expect(
        await screen.findByText("Unmapped Relationships")
      ).toBeInTheDocument();
    });

    it("does not warn when every agent in the cell is mapped", async () => {
      await renderColumnMapping(
        createCollectorsSpreadsheet("Person A; Person B")
      );
      await waitFor(async () =>
        expect(getSelectedValue(await findRelationshipRow("Person B"))).toEqual(
          "Person B"
        )
      );

      await submitForm();

      await waitForSavedResources();
      expect(screen.queryByText("Unmapped Relationships")).toBeNull();
    });
  });

  describe("classification", () => {
    it("automatically maps a taxonomic rank column and imports the rank", async () => {
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Genus"],
          ["S-1", "Aus"]
        ])
      );

      const mappingRow = await findColumnMappingRow("Genus");
      await waitFor(() =>
        expect(
          Array.from(mappingRow.querySelectorAll("[class*='singleValue']")).map(
            (value) => value.textContent
          )
        ).toEqual(["Scientific Name Classification", "genus"])
      );

      await submitForm();

      const resources = await waitForSavedResources();
      expect(
        resources[0].organism[0].determination[0].scientificNameDetails
      ).toEqual({ classificationRanks: "genus", classificationPath: "Aus" });
    });
  });

  describe("network requests", () => {
    async function countRequests(columnCount: number, rowCount: number) {
      mockGet.mockClear();
      const headers = [
        "Primary ID",
        ...Array.from({ length: columnCount - 1 }, (_, i) => `Column ${i}`)
      ];
      const { unmount } = mountWithAppContext(
        <WorkbookUploadContextProvider>
          <UploadSpreadsheet
            spreadsheet={createSpreadsheet([
              headers,
              ...Array.from({ length: rowCount }, (_, row) =>
                headers.map((header) => `${header} ${row}`)
              )
            ])}
          />
        </WorkbookUploadContextProvider>,
        { apiContext }
      );
      // The column map is only built once every lookup has loaded.
      await waitFor(async () =>
        expect(
          getSelectedValue(await findColumnMappingRow("Primary ID"))
        ).toEqual("Primary ID")
      );
      const count = mockGet.mock.calls.length;
      unmount();
      return count;
    }

    it("does not grow with the number of columns or rows", async () => {
      const small = await countRequests(1, 1);
      const large = await countRequests(20, 100);

      expect(large).toEqual(small);
    });
  });

  describe("parent material sample lookup", () => {
    /** The parent ids are resolved into the saved column map, not the rows. */
    function getParentValueMapping() {
      return (db.workbooks.add as jest.Mock).mock.calls[0][0]
        .relationshipMapping.Parent.valueMapping;
    }

    it("links the parent without treating it as a duplicate", async () => {
      // S-1 exists as a parent in the group, but not in Collection A.
      parentMaterialSampleNames = ["P-1", "S-1"];
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Collection", "Parent"],
          ["S-1", "Collection A", "P-1"]
        ])
      );

      await submitForm();

      await waitForSavedResources();
      expect(getParentValueMapping()["P-1"]).toEqual({
        id: "id-P-1",
        type: "material-sample"
      });
      expect(screen.queryByText("Duplicate Primary IDs")).toBeNull();
    });

    it("does not use the duplicate check results to find the parent", async () => {
      existingMaterialSampleNames = ["P-1"];
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Collection", "Parent"],
          ["S-1", "Collection A", "P-1"]
        ])
      );

      await submitForm();

      expect(
        await findErrorMessage(/Missing parent material sample names: P-1/)
      ).toBeInTheDocument();
    });

    it("looks up parents in chunks of 100 and names with a comma individually", async () => {
      const parents = [
        ...Array.from({ length: 150 }, (_, i) => `P-${i}`),
        "P, comma"
      ];
      parentMaterialSampleNames = parents;
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Parent"],
          ...parents.map((parent, i) => [`S-${i}`, parent]),
          // A repeated parent is only looked up once.
          ["S-extra", "P-0"]
        ])
      );

      await submitForm();

      await waitForSavedResources();
      expect(Object.keys(getParentValueMapping()).sort()).toEqual(
        [...parents].sort()
      );
      const filters = getMaterialSampleFilters("group");
      expect(
        filters.map(
          ({ materialSampleName }) =>
            materialSampleName.EQ ??
            String(materialSampleName.IN).split(",").length
        )
      ).toEqual([100, 50, "P, comma"]);
    });
  });

  describe("validation", () => {
    it("shows an error when two columns map to the same field", async () => {
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Barcode", "barcode"],
          ["S-1", "B-1", "B-2"]
        ])
      );

      await submitForm();

      expect(
        (
          await within(await screen.findByRole("status")).findAllByText(
            /This column should not map to the same field/
          )
        ).length
      ).toBeGreaterThan(0);
      expect(db.workbooks.add).not.toHaveBeenCalled();
    });

    it("shows an error when a column is neither mapped nor skipped", async () => {
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Unknown Column"],
          ["S-1", "value"]
        ])
      );

      await submitForm();

      expect(
        await findErrorMessage(
          /Unknown Column - Please select a field or skip importing it/
        )
      ).toBeInTheDocument();
      expect(db.workbooks.add).not.toHaveBeenCalled();
    });

    it("shows an error for an invalid boolean value", async () => {
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Publicly Releasable"],
          ["S-1", "maybe"]
        ])
      );

      await submitForm();

      expect(
        await findErrorMessage(
          /Invalid data format, sheet: 1, row: 2, field: publiclyReleasable, data type should be a boolean/i
        )
      ).toBeInTheDocument();
      expect(db.workbooks.add).not.toHaveBeenCalled();
    });

    it("shows an error for an invalid date value", async () => {
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Preparation Date"],
          ["S-1", "not a date"]
        ])
      );

      await submitForm();

      expect(
        await findErrorMessage(/preparationDate needs to be a valid date/)
      ).toBeInTheDocument();
      expect(db.workbooks.add).not.toHaveBeenCalled();
    });

    it("shows an error when a parent material sample cannot be found", async () => {
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Parent"],
          ["S-1", "P-1"]
        ])
      );

      await submitForm();

      expect(
        await findErrorMessage(/Missing parent material sample names: P-1/)
      ).toBeInTheDocument();
      expect(db.workbooks.add).not.toHaveBeenCalled();
    });
  });

  describe("submitting", () => {
    it("imports every row when there are no warnings", async () => {
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Barcode"],
          ["S-1", "B-1"],
          ["S-2", "B-2"]
        ])
      );

      await submitForm();

      const resources = await waitForSavedResources();
      expect(
        resources.map(({ materialSampleName, barcode }) => ({
          materialSampleName,
          barcode
        }))
      ).toEqual([
        { materialSampleName: "S-1", barcode: "B-1" },
        { materialSampleName: "S-2", barcode: "B-2" }
      ]);
      expect(screen.queryByText("Proceed with warnings?")).toBeNull();
    });

    it("warns about skipped columns and leaves them out of the import", async () => {
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Barcode"],
          ["S-1", "B-1"]
        ])
      );

      await skipColumn("Barcode");
      await submitForm();

      expect(
        await screen.findByText("Proceed with warnings?")
      ).toBeInTheDocument();
      expect(screen.getByText("Skipped Columns")).toBeInTheDocument();
      await userEvent.click(
        screen.getByRole("button", { name: /Import anyway/ })
      );

      const resources = await waitForSavedResources();
      expect(resources).toHaveLength(1);
      expect(resources[0].materialSampleName).toEqual("S-1");
      expect(resources[0].barcode).toBeUndefined();
    });

    it("warns about unmapped relationships and imports nothing when cancelled", async () => {
      await renderColumnMapping(createCollectionSpreadsheet("Collection"));

      await submitForm();

      expect(
        await screen.findByText("Unmapped Relationships")
      ).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: /Cancel/ }));

      await waitFor(() =>
        expect(screen.queryByText("Proceed with warnings?")).toBeNull()
      );
      expect(db.workbooks.add).not.toHaveBeenCalled();
    });

    it("skips rows with a primary id repeated in the spreadsheet", async () => {
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Barcode"],
          ["S-1", "B-1"],
          ["S-2", "B-2"],
          ["S-1", "B-3"]
        ])
      );

      await submitForm();

      expect(
        await screen.findByText("Duplicate Primary IDs")
      ).toBeInTheDocument();
      expect(
        screen.getByText("2 rows will be skipped if you proceed.")
      ).toBeInTheDocument();
      await userEvent.click(
        screen.getByRole("button", { name: /Skip duplicates and import/ })
      );

      const resources = await waitForSavedResources();
      expect(resources.map((resource) => resource.materialSampleName)).toEqual([
        "S-2"
      ]);
    });

    it("skips rows with a primary id that already exists in the same collection", async () => {
      existingMaterialSampleNames = ["S-1"];
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Collection"],
          ["S-1", "Collection A"],
          ["S-2", "Collection A"]
        ])
      );

      await submitForm();

      expect(
        await screen.findByText(/already exist in the same collection/)
      ).toBeInTheDocument();
      await userEvent.click(
        screen.getByRole("button", { name: /Skip duplicates and import/ })
      );

      const resources = await waitForSavedResources();
      expect(resources.map((resource) => resource.materialSampleName)).toEqual([
        "S-2"
      ]);
    });

    it.each([
      ["a Collection Name header", undefined],
      [
        "a generated template's collection.name column",
        ["materialSampleName", "collection.name"]
      ]
    ])(
      "checks the server for duplicates from %s",
      async (_description, originalColumns) => {
        existingMaterialSampleNames = ["S-1"];
        await renderColumnMapping({
          0: {
            sheetName: "Sheet1",
            originalColumns,
            rows: [
              { rowNumber: 0, content: ["Primary ID", "Collection Name"] },
              { rowNumber: 1, content: ["S-1", "Collection A"] },
              { rowNumber: 2, content: ["S-2", "Collection A"] }
            ]
          }
        });
        await waitFor(async () =>
          expect(
            getSelectedValue(await findRelationshipRow("Collection A"))
          ).toEqual("Collection A")
        );

        await submitForm();

        expect(
          await screen.findByText(/already exist in the same collection/)
        ).toBeInTheDocument();
        expect(getMaterialSampleFilters("collection.uuid")).toEqual([
          expect.objectContaining({
            "collection.uuid": { EQ: "collection-a" }
          })
        ]);
      }
    );

    it("does not check the server for duplicates when appending data", async () => {
      existingMaterialSampleNames = ["S-1"];
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Collection"],
          ["S-1", "Collection A"]
        ])
      );

      await userEvent.click(
        screen.getByRole("checkbox", { name: /Append Data/ })
      );
      await submitForm();

      const resources = await waitForSavedResources();
      expect(resources).toHaveLength(1);
      expect(
        mockGet.mock.calls.some(
          ([path]) => path === "collection-api/material-sample"
        )
      ).toBe(false);
    });

    it("shows an error when every row is a duplicate", async () => {
      await renderColumnMapping(
        createSpreadsheet([
          ["Primary ID", "Barcode"],
          ["S-1", "B-1"],
          ["S-1", "B-2"]
        ])
      );

      await submitForm();

      expect(
        await findErrorMessage(/Every row in the spreadsheet has a duplicate/)
      ).toBeInTheDocument();
      expect(db.workbooks.add).not.toHaveBeenCalled();
    });
  });
});
