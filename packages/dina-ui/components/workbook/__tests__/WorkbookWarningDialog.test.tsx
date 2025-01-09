import { fireEvent, screen } from "@testing-library/react";
import { WorkbookWarningDialog } from "../WorkbookWarningDialog";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
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

  it("expands skipped columns on button click", () => {
    const skippedColumns = ["Column1", "Column2", "Column3"];
    mountWithAppContext(
      <WorkbookWarningDialog
        skippedColumns={skippedColumns}
        unmappedRelationshipsError={[]}
      />
    );

    // Click the "Show all" button
    const showAllButton = screen.getByRole("button", { name: "Show More" });
    fireEvent.click(showAllButton);

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

  it("expands unmapped relationships on button click", () => {
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
    fireEvent.click(showAllButton);

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
});
