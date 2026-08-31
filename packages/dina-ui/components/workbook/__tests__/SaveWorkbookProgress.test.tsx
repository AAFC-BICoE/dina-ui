import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mountWithAppContext } from "common-ui";
import * as WorkbookProvider from "../WorkbookProvider";
import { SaveWorkbookProgress } from "../SaveWorkbookProgress";
import "@testing-library/jest-dom";

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/workbook/upload",
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    }
  })
}));

jest.mock("../WorkbookProvider", () => ({
  ...jest.requireActual("../WorkbookProvider"),
  useWorkbookContext: jest.fn()
}));

describe("SaveWorkbookProgress", () => {
  const mockGet = jest.fn();
  const mockSave = jest.fn();
  const mockBulkDeleteResources = jest.fn();
  const mockOnWorkbookCanceled = jest.fn();
  const mockOnWorkbookFailed = jest.fn();

  const apiContext = {
    apiClient: { get: mockGet } as any,
    save: mockSave,
    bulkDeleteResources: mockBulkDeleteResources
  };

  const baseWorkbookResources = [
    { type: "material-sample", materialSampleName: "sample-1" },
    { type: "material-sample", materialSampleName: "sample-2" },
    { type: "material-sample", materialSampleName: "sample-3" },
    { type: "material-sample", materialSampleName: "sample-4" },
    { type: "material-sample", materialSampleName: "sample-5" },
    { type: "material-sample", materialSampleName: "sample-6" }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockGet.mockImplementation(async (path: string, options?: any) => {
      if (
        path === "/collection-api/material-sample" &&
        (options?.include === "collectingEvent" ||
          options?.fiql?.includes("sourceSet"))
      ) {
        return {
          data: [
            {
              id: "mat-sample-101",
              type: "material-sample",
              collectingEvent: { id: "col-event-201", type: "collecting-event" }
            },
            {
              id: "mat-sample-102",
              type: "material-sample"
            }
          ]
        };
      }

      return { data: [] };
    });
  });

  it("Deletes created material-sample and collecting-event records when cleaning up failed import", async () => {
    // Stateful mock hook so failSavingWorkbook triggers a re-render with status = "FAILED"
    (WorkbookProvider.useWorkbookContext as jest.Mock).mockImplementation(
      () => {
        const [status, setStatus] = React.useState<string>("SAVING");
        const [progress, setProgress] = React.useState<number>(0);
        const [error, setError] = React.useState<any>(undefined);

        return {
          workbookResources: baseWorkbookResources,
          progress,
          group: "test-group",
          type: "material-sample",
          apiBaseUrl: "/collection-api",
          status,
          error,
          saveProgress: jest.fn((p) => setProgress(p)),
          pauseSavingWorkbook: jest.fn(() => setStatus("PAUSED")),
          resumeSavingWorkbook: jest.fn(() => setStatus("SAVING")),
          finishSavingWorkbook: jest.fn(() => setStatus("FINISHED")),
          cancelSavingWorkbook: jest.fn(() => setStatus("CANCELED")),
          failSavingWorkbook: jest.fn((err) => {
            setStatus("FAILED");
            setError(err);
          }),
          workbookColumnMap: {},
          appendData: false
        };
      }
    );

    let callCount = 0;
    mockSave.mockImplementation(async (ops) => {
      callCount++;
      if (callCount === 1) {
        return (Array.isArray(ops) ? ops : [ops]).map((_op, idx) => ({
          id: `mat-sample-10${idx + 1}`,
          type: "material-sample"
        }));
      }
      throw new Error("Import save failed");
    });

    mountWithAppContext(
      <SaveWorkbookProgress
        onWorkbookCanceled={mockOnWorkbookCanceled}
        onWorkbookFailed={mockOnWorkbookFailed}
      />,
      { apiContext }
    );

    const deleteButton = await screen.findByRole("button", {
      name: /Delete Failed Import/i
    });

    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        "/collection-api/material-sample",
        expect.objectContaining({
          include: "collectingEvent"
        })
      );
    });

    expect(mockBulkDeleteResources).toHaveBeenCalledWith(
      ["mat-sample-101", "mat-sample-102"],
      {
        apiBaseUrl: "/collection-api",
        resourceType: "material-sample"
      }
    );

    expect(mockBulkDeleteResources).toHaveBeenCalledWith(["col-event-201"], {
      apiBaseUrl: "/collection-api",
      resourceType: "collecting-event"
    });
  });
});
