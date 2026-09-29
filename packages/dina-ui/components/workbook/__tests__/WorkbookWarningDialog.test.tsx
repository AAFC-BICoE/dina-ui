import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkbookWarningDialog } from "../WorkbookWarningDialog";
import { mountWithAppContext } from "common-ui";
import "@testing-library/jest-dom";

describe("WorkbookWarningDialog", () => {
  it("renders skipped columns warning with show all button", () => {
    const skippedColumns = ["Column1", "Column2", "Column3"];
    mountWithAppContext(
      <WorkbookWarningDialog
        skippedColumns={skippedColumns}
        unmappedRelationshipsError={[]}
      />
    );

    // Ensure the skipped column section is displayed, but not the unmapped relationships one.
    expect(screen.queryByText("Skipped Columns")).toBeInTheDocument();
    expect(
      screen.queryByText("Unmapped Relationships")
    ).not.toBeInTheDocument();

    // Check initial display of skipped columns (truncated)
    expect(screen.getByText("Column1, Column2")).toBeInTheDocument();
    expect(screen.getByText("...")).toBeInTheDocument();

    // Check "Show all" button is rendered
    expect(
      screen.getByRole("button", { name: "Show More" })
    ).toBeInTheDocument();
  });

  it("renders skipped columns warning under the maximum amount, don't display show more button", () => {
    const skippedColumns = ["Column1", "Column2"];
    mountWithAppContext(
      <WorkbookWarningDialog
        skippedColumns={skippedColumns}
        unmappedRelationshipsError={[]}
      />
    );

    // Ensure the skipped column section is displayed, but not the unmapped relationships one.
    expect(screen.queryByText("Skipped Columns")).toBeInTheDocument();
    expect(
      screen.queryByText("Unmapped Relationships")
    ).not.toBeInTheDocument();

    // Check initial display of skipped columns (truncated)
    expect(screen.queryByText("Column1, Column2")).toBeInTheDocument();
    expect(screen.queryByText("...")).not.toBeInTheDocument();

    // Check "Show all" button is not rendered
    expect(
      screen.queryByRole("button", { name: "Show More" })
    ).not.toBeInTheDocument();
  });

  it("expands skipped columns on button click", async () => {
    const skippedColumns = ["Column1", "Column2", "Column3"];
    mountWithAppContext(
      <WorkbookWarningDialog
        skippedColumns={skippedColumns}
        unmappedRelationshipsError={[]}
      />
    );

    // Click the "Show all" button
    const showAllButton = screen.getByRole("button", { name: "Show More" });
    await userEvent.click(showAllButton);

    // Check all skipped columns are displayed in a list
    expect(screen.getByText("Column1")).toBeInTheDocument();
    expect(screen.getByText("Column2")).toBeInTheDocument();
    expect(screen.getByText("Column3")).toBeInTheDocument();

    // Check "Show less" button is rendered after expansion
    expect(
      screen.getByRole("button", { name: "Show Less" })
    ).toBeInTheDocument();
  });

  it("renders unmapped relationships warning with show all button", () => {
    const unmappedRelationshipsError = [
      "Relationship1",
      "Relationship2",
      "Relationship3"
    ];
    mountWithAppContext(
      <WorkbookWarningDialog
        skippedColumns={[]}
        unmappedRelationshipsError={unmappedRelationshipsError}
      />
    );

    // Ensure the unmapped relationship section is displayed, but not the skipped columns one.
    expect(screen.queryByText("Unmapped Relationships")).toBeInTheDocument();
    expect(screen.queryByText("Skipped Columns")).not.toBeInTheDocument();

    // Check initial display of unmapped relationships (truncated)
    expect(
      screen.getByText("Relationship1, Relationship2")
    ).toBeInTheDocument();
    expect(screen.getByText("...")).toBeInTheDocument();

    // Check "Show More" button is rendered
    expect(
      screen.getByRole("button", { name: "Show More" })
    ).toBeInTheDocument();
  });

  it("renders unmapped relationships warning under the maximum amount, don't display show more button", () => {
    const unmappedRelationshipsError = ["Relationship1", "Relationship2"];
    mountWithAppContext(
      <WorkbookWarningDialog
        skippedColumns={[]}
        unmappedRelationshipsError={unmappedRelationshipsError}
      />
    );

    // Ensure the skipped column section is displayed, but not the unmapped relationships one.
    expect(screen.queryByText("Unmapped Relationships")).toBeInTheDocument();
    expect(screen.queryByText("Skipped Columns")).not.toBeInTheDocument();

    // Check initial display of skipped columns (truncated)
    expect(
      screen.queryByText("Relationship1, Relationship2")
    ).toBeInTheDocument();
    expect(screen.queryByText("...")).not.toBeInTheDocument();

    // Check "Show all" button is not rendered
    expect(
      screen.queryByRole("button", { name: "Show More" })
    ).not.toBeInTheDocument();
  });

  it("expands unmapped relationships on button click", async () => {
    const unmappedRelationshipsError = [
      "Relationship1",
      "Relationship2",
      "Relationship3"
    ];
    mountWithAppContext(
      <WorkbookWarningDialog
        skippedColumns={[]}
        unmappedRelationshipsError={unmappedRelationshipsError}
      />
    );

    // Click the "Show More" button
    const showAllButton = screen.getByRole("button", { name: "Show More" });
    await userEvent.click(showAllButton);

    // Check all unmapped relationships are displayed in a list
    expect(screen.getByText("Relationship1")).toBeInTheDocument();
    expect(screen.getByText("Relationship2")).toBeInTheDocument();
    expect(screen.getByText("Relationship3")).toBeInTheDocument();

    // Check "Show Less" button is rendered after expansion
    expect(
      screen.getByRole("button", { name: "Show Less" })
    ).toBeInTheDocument();
  });

  it("Display both sections if both errors are provided", () => {
    const skippedColumns = ["Column1", "Column2", "Column3"];
    const unmappedRelationshipsError = [
      "Relationship1",
      "Relationship2",
      "Relationship3"
    ];
    mountWithAppContext(
      <WorkbookWarningDialog
        skippedColumns={skippedColumns}
        unmappedRelationshipsError={unmappedRelationshipsError}
      />
    );

    // Both sections should be displayed.
    expect(screen.queryByText("Unmapped Relationships")).toBeInTheDocument();
    expect(screen.queryByText("Skipped Columns")).toBeInTheDocument();
  });

  it("Renders duplicate primary ids found on the spreadsheet and on the server", () => {
    mountWithAppContext(
      <WorkbookWarningDialog
        skippedColumns={[]}
        unmappedRelationshipsError={[]}
        duplicatePrimaryIds={[
          {
            materialSampleName: "S-1",
            collectionName: "Collection A",
            rowNumbers: [1, 3],
            localDuplicate: true,
            serverDuplicate: false
          },
          {
            materialSampleName: "S-2",
            rowNumbers: [2],
            localDuplicate: true,
            serverDuplicate: false
          },
          {
            materialSampleName: "S-4",
            collectionName: "Collection A",
            rowNumbers: [4],
            localDuplicate: false,
            serverDuplicate: true
          },
          {
            materialSampleName: "S-5",
            collectionName: "Collection A",
            rowNumbers: [5],
            localDuplicate: false,
            serverDuplicate: false
          }
        ]}
      />
    );

    expect(screen.getByText("Duplicate Primary IDs")).toBeInTheDocument();
    expect(
      screen.getByText("4 rows will be skipped if you proceed.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Skipped Columns")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Unmapped Relationships")
    ).not.toBeInTheDocument();

    expect(
      screen.getByText(/appear more than once in the spreadsheet/)
    ).toBeInTheDocument();
    expect(screen.getByText("S-1 (Collection A), S-2")).toBeInTheDocument();

    expect(
      screen.getByText(/already exist in the same collection/)
    ).toBeInTheDocument();
    expect(screen.getByText("S-4 (Collection A)")).toBeInTheDocument();

    expect(screen.queryByText(/S-5/)).not.toBeInTheDocument();
  });

  it("Only renders the server duplicate list when there are no spreadsheet duplicates", () => {
    mountWithAppContext(
      <WorkbookWarningDialog
        skippedColumns={[]}
        unmappedRelationshipsError={[]}
        duplicatePrimaryIds={[
          {
            materialSampleName: "S-4",
            collectionName: "Collection A",
            rowNumbers: [4],
            localDuplicate: false,
            serverDuplicate: true
          }
        ]}
      />
    );

    expect(screen.getByText("Duplicate Primary IDs")).toBeInTheDocument();
    expect(
      screen.getByText("1 row will be skipped if you proceed.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/appear more than once in the spreadsheet/)
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/already exist in the same collection/)
    ).toBeInTheDocument();
  });

  it("Does not render the duplicate section when no duplicates are found", () => {
    mountWithAppContext(
      <WorkbookWarningDialog
        skippedColumns={["Column1"]}
        unmappedRelationshipsError={[]}
        duplicatePrimaryIds={[
          {
            materialSampleName: "S-5",
            rowNumbers: [5],
            localDuplicate: false,
            serverDuplicate: false
          }
        ]}
      />
    );

    expect(screen.queryByText("Duplicate Primary IDs")).not.toBeInTheDocument();
  });

  it("Expands duplicate primary ids on button click", async () => {
    mountWithAppContext(
      <WorkbookWarningDialog
        skippedColumns={[]}
        unmappedRelationshipsError={[]}
        duplicatePrimaryIds={["S-1", "S-2", "S-3"].map((name, index) => ({
          materialSampleName: name,
          rowNumbers: [index, index + 10],
          localDuplicate: true,
          serverDuplicate: false
        }))}
      />
    );

    expect(screen.getByText("S-1, S-2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show More" }));

    expect(screen.getByText("S-1")).toBeInTheDocument();
    expect(screen.getByText("S-2")).toBeInTheDocument();
    expect(screen.getByText("S-3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show Less" })
    ).toBeInTheDocument();
  });
});
