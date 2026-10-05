import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mountWithAppContext } from "common-ui";
import { useEffect } from "react";
import "@testing-library/jest-dom";
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

let existingMaterialSampleNames: string[] = [];

const mockGet = jest.fn(async (path: string) => {
  if (
    path.includes("resource-name-identifier") &&
    path.includes("filter[type][EQ]=collection")
  ) {
    return { data: COLLECTIONS };
  }
  if (path.startsWith("collection-api/material-sample?")) {
    const exists = existingMaterialSampleNames.some((name) =>
      path.includes(`filter[materialSampleName][EQ]=${name}&`)
    );
    return {
      data: exists ? [{ id: "existing", type: "material-sample" }] : []
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
        mockGet.mock.calls.some(([path]) =>
          path.startsWith("collection-api/material-sample?")
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
