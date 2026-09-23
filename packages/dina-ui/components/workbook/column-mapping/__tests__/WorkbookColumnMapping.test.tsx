import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mountWithAppContext } from "common-ui";
import { useEffect } from "react";
import "@testing-library/jest-dom";
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

const mockGet = jest.fn(async (path: string) => {
  if (
    path.includes("resource-name-identifier") &&
    path.includes("filter[type][EQ]=collection")
  ) {
    return { data: COLLECTIONS };
  }
  return { data: [] };
});

const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: jest.fn(async () => [])
};

function createSpreadsheet(collectionHeader: string): WorkbookJSON {
  return {
    0: {
      sheetName: "Sheet1",
      rows: [
        { rowNumber: 0, content: ["Primary ID", collectionHeader] },
        { rowNumber: 1, content: ["S-1", "Spreadsheet Collection"] },
        { rowNumber: 2, content: ["S-2", "Spreadsheet Collection"] }
      ]
    }
  };
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

function renderColumnMapping(collectionHeader: string) {
  mountWithAppContext(
    <WorkbookUploadContextProvider>
      <UploadSpreadsheet spreadsheet={createSpreadsheet(collectionHeader)} />
    </WorkbookUploadContextProvider>,
    { apiContext }
  );
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

function getSelectedValue(row: HTMLElement) {
  return row.querySelector("[class*='singleValue']")?.textContent;
}

describe("WorkbookColumnMapping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("keeps the selected related record for an automatically mapped column", async () => {
    renderColumnMapping("Collection");

    await selectRelatedRecord("Spreadsheet Collection", "Collection B");

    await waitFor(async () =>
      expect(
        getSelectedValue(await findRelationshipRow("Spreadsheet Collection"))
      ).toEqual("Collection B")
    );
  });

  it("automatically maps a Collection Name column", async () => {
    renderColumnMapping("Collection Name");

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
    renderColumnMapping("Owning Collection");

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
    renderColumnMapping("Owning Collection");

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
