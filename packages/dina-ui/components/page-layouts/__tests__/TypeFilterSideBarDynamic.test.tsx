import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { within } from "@testing-library/react";
import { mountWithAppContext } from "common-ui";
import { useState } from "react";
import {
  SidebarOption,
  TypeFilterSideBarDynamic,
  TypeFilterState
} from "../TypeFilterSideBarDynamic";

const PARENTS: SidebarOption[] = [
  { id: "association", label: "Association Type", count: 10 },
  { id: "coordinate", label: "Coordinate Format", count: 4 },
  { id: "ma", label: "Managed Attribute", count: 20 }
];

const CHILDREN_MAP: Record<string, SidebarOption[]> = {
  ma: [
    { id: "MATERIAL_SAMPLE", label: "Material Sample", count: 14 },
    { id: "COLLECTING_EVENT", label: "Collecting Event", count: 6 }
  ]
};

const mockOnChange = jest.fn();

/** Keeps the selection in state so the checkboxes reflect each change. */
function TestSidebar({ initial }: { initial?: TypeFilterState }) {
  const [selected, setSelected] = useState<TypeFilterState>(
    initial ?? { parent_cv_ids: [], children: [] }
  );
  return (
    <TypeFilterSideBarDynamic
      parents={PARENTS}
      childrenMap={CHILDREN_MAP}
      selected={selected}
      onChange={(next) => {
        mockOnChange(next);
        setSelected(next);
      }}
    />
  );
}

function getSection(container: HTMLElement, id: string) {
  return within(container.querySelector<HTMLElement>(`#${id}`)!);
}

describe("TypeFilterSideBarDynamic", () => {
  beforeEach(jest.clearAllMocks);

  it("Lists the managed attribute components and every vocabulary type.", () => {
    const wrapper = mountWithAppContext(<TestSidebar />);

    const managedAttributes = getSection(
      wrapper.container,
      "cv-managed-attributes-filter"
    );
    expect(managedAttributes.getByText("Managed Attributes")).toBeVisible();
    expect(managedAttributes.getByText("All").closest("li")).toHaveTextContent(
      "All20"
    );
    expect(managedAttributes.getByLabelText("Material Sample")).toBeVisible();
    expect(managedAttributes.getByLabelText("Collecting Event")).toBeVisible();
    expect(managedAttributes.queryByText("Association Type")).toBeNull();

    const types = getSection(wrapper.container, "cv-type-filter");
    expect(types.getByText("Filter by Type")).toBeVisible();
    expect(types.getByLabelText("Association Type")).toBeVisible();
    expect(types.getByLabelText("Coordinate Format")).toBeVisible();
    expect(types.getByLabelText("Managed Attribute")).toBeVisible();
    expect(types.queryByText("Material Sample")).toBeNull();
    expect(types.getByText("All Types").closest("li")).toHaveTextContent(
      "All Types34"
    );
  });

  it("Selects the Managed Attribute type when a data component is selected.", async () => {
    const wrapper = mountWithAppContext(<TestSidebar />);

    await userEvent.click(wrapper.getByLabelText("Material Sample"));

    expect(mockOnChange).toHaveBeenLastCalledWith({
      parent_cv_ids: ["ma"],
      children: ["MATERIAL_SAMPLE"]
    });
    expect(wrapper.getByLabelText("Managed Attribute")).toBeChecked();
    expect(wrapper.getByLabelText("Material Sample")).toBeChecked();
    expect(wrapper.getByLabelText("Collecting Event")).not.toBeChecked();
    expect(
      (wrapper.container.querySelector("#cv-select-all-components") as any)
        .indeterminate
    ).toBe(true);
  });

  it("Deselects the data components when the Managed Attribute type is deselected.", async () => {
    const wrapper = mountWithAppContext(
      <TestSidebar
        initial={{
          parent_cv_ids: ["ma", "association"],
          children: ["MATERIAL_SAMPLE", "COLLECTING_EVENT"]
        }}
      />
    );

    await userEvent.click(wrapper.getByLabelText("Managed Attribute"));

    expect(mockOnChange).toHaveBeenLastCalledWith({
      parent_cv_ids: ["association"],
      children: []
    });
    expect(wrapper.getByLabelText("Material Sample")).not.toBeChecked();
    expect(wrapper.getByLabelText("Collecting Event")).not.toBeChecked();
    expect(wrapper.getByLabelText("Association Type")).toBeChecked();
  });

  it("Toggles every data component with the managed attributes All option.", async () => {
    const wrapper = mountWithAppContext(
      <TestSidebar initial={{ parent_cv_ids: ["coordinate"], children: [] }} />
    );

    await userEvent.click(wrapper.getByLabelText("All"));
    expect(mockOnChange).toHaveBeenLastCalledWith({
      parent_cv_ids: ["coordinate", "ma"],
      children: ["MATERIAL_SAMPLE", "COLLECTING_EVENT"]
    });
    expect(wrapper.getByLabelText("Material Sample")).toBeChecked();
    expect(wrapper.getByLabelText("Collecting Event")).toBeChecked();
    expect(wrapper.getByLabelText("Managed Attribute")).toBeChecked();

    await userEvent.click(wrapper.getByLabelText("All"));
    expect(mockOnChange).toHaveBeenLastCalledWith({
      parent_cv_ids: ["coordinate"],
      children: []
    });
    expect(wrapper.getByLabelText("Managed Attribute")).not.toBeChecked();
    expect(wrapper.getByLabelText("Coordinate Format")).toBeChecked();
  });

  it("Toggles every type and data component with All Types.", async () => {
    const wrapper = mountWithAppContext(<TestSidebar />);

    await userEvent.click(wrapper.getByLabelText("All Types"));
    expect(mockOnChange).toHaveBeenLastCalledWith({
      parent_cv_ids: ["association", "coordinate", "ma"],
      children: ["MATERIAL_SAMPLE", "COLLECTING_EVENT"]
    });
    expect(wrapper.getByLabelText("All")).toBeChecked();

    await userEvent.click(wrapper.getByLabelText("All Types"));
    expect(mockOnChange).toHaveBeenLastCalledWith({
      parent_cv_ids: [],
      children: []
    });
    expect(wrapper.getByLabelText("Material Sample")).not.toBeChecked();
  });

  it("Hides the managed attributes section when no vocabulary has data components.", () => {
    const wrapper = mountWithAppContext(
      <TypeFilterSideBarDynamic
        parents={PARENTS}
        selected={{ parent_cv_ids: [] }}
        onChange={mockOnChange}
      />
    );

    expect(
      wrapper.container.querySelector("#cv-managed-attributes-filter")
    ).toBeNull();
    expect(wrapper.getByLabelText("Managed Attribute")).toBeVisible();
  });
});
