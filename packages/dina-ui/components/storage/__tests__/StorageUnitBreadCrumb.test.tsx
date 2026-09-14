import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "common-ui";
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitBreadCrumb } from "../StorageUnitBreadCrumb";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";

const storageUnitWithHierarchy: PersistedResource<StorageUnit> = {
  id: "A",
  group: "group",
  name: "A",
  type: "storage-unit",
  isGeneric: false,
  storageUnitType: {
    name: "Box",
    id: "BOX",
    type: "storage-unit-type",
    group: "test-group"
  },
  hierarchy: [
    { uuid: "A", name: "A", typeName: "Shelf", typeUuid: "SHELF" },
    { uuid: "B", name: "B", typeName: "Cabinet", typeUuid: "CABINET" },
    { uuid: "C", name: "C", typeName: "Room", typeUuid: "ROOM" }
  ]
};
const storageUnitWithParentHierarchy: PersistedResource<StorageUnit> = {
  id: "A",
  group: "group",
  name: "A",
  type: "storage-unit",
  isGeneric: false,
  storageUnitType: {
    name: "Box",
    id: "BOX",
    type: "storage-unit-type",
    group: "test-group"
  },
  parentStorageUnit: {
    id: "B",
    group: "group",
    name: "B",
    type: "storage-unit",
    isGeneric: false,
    hierarchy: [
      { uuid: "B", name: "B", typeName: "Cabinet", typeUuid: "CABINET" },
      { uuid: "C", name: "C", typeName: "Room", typeUuid: "ROOM" }
    ]
  }
};

describe("StorageUnitBreadCrumb component", () => {
  it("Renders the breadcrumb path from the hierarchy", async () => {
    const wrapper = mountWithAppContext(
      <StorageUnitBreadCrumb storageUnit={storageUnitWithHierarchy} />
    );

    // Hover over image to show tooltip
    const infoIcon = wrapper.container.querySelector(".tooltip-info-icon");
    await userEvent.hover(infoIcon!);

    // Test tooltip rendering while hovering on the img element
    await waitFor(() => {
      expect(
        wrapper.getByRole("tooltip", {
          name: /c \(room\) opens in new tab > b \(cabinet\) opens in new tab > a \(box\) opens in new tab/i
        })
      ).toBeInTheDocument();
    });

    // Test href value/attribute for each link in the tooltip
    expect(wrapper.getByRole("link", { name: /c \(room\)/i })).toHaveAttribute(
      "href",
      "/collection/storage-unit/view?id=C"
    );
    expect(
      wrapper.getByRole("link", { name: /b \(cabinet\)/i })
    ).toHaveAttribute("href", "/collection/storage-unit/view?id=B");
    expect(
      wrapper.getAllByRole("link", { name: /a \(box\)/i })[0]
    ).toHaveAttribute("href", "/collection/storage-unit/view?id=A");
  });

  it("Renders the breadcrumb path from the parent's hierarchy", async () => {
    const wrapper = mountWithAppContext(
      <StorageUnitBreadCrumb storageUnit={storageUnitWithParentHierarchy} />
    );

    // Hover over image to show tooltip
    const infoIcon = wrapper.container.querySelector(".tooltip-info-icon");
    await userEvent.hover(infoIcon!);

    // Test tooltip rendering while hovering on the img element
    await waitFor(() => {
      expect(
        wrapper.getByRole("tooltip", {
          name: /c \(room\) opens in new tab > b \(cabinet\) opens in new tab > a \(box\) opens in new tab/i
        })
      ).toBeInTheDocument();
    });

    // Test href value/attribute for each link in the tooltip
    expect(wrapper.getByRole("link", { name: /c \(room\)/i })).toHaveAttribute(
      "href",
      "/collection/storage-unit/view?id=C"
    );
    expect(
      wrapper.getByRole("link", { name: /b \(cabinet\)/i })
    ).toHaveAttribute("href", "/collection/storage-unit/view?id=B");
    expect(
      wrapper.getAllByRole("link", { name: /a \(box\)/i })[0]
    ).toHaveAttribute("href", "/collection/storage-unit/view?id=A");
  });

  it("Does not render a tooltip when parentStorageUnit exists but lacks hierarchy, and the unit itself has no hierarchy", async () => {
    const unitWithBareParent: PersistedResource<StorageUnit> = {
      id: "VIAL-1",
      group: "group",
      name: "vial test",
      type: "storage-unit",
      isGeneric: false,
      storageUnitType: {
        name: "vial",
        id: "VIAL_TYPE",
        type: "storage-unit-type",
        group: "test-group"
      },
      parentStorageUnit: {
        id: "BOX-1",
        group: "group",
        name: "box",
        type: "storage-unit",
        isGeneric: false
      }
    };

    const wrapper = mountWithAppContext(
      <StorageUnitBreadCrumb storageUnit={unitWithBareParent} />
    );

    // No tooltip should appear — parentStorageUnit exists but has no hierarchy,
    // and the unit itself has no hierarchy, so parentPath is empty.
    expect(
      wrapper.container.querySelector(".tooltip-info-icon")
    ).not.toBeInTheDocument();

    // The unit name should still be displayed.
    expect(
      wrapper.getByRole("link", { name: /vial test \(vial\)/i })
    ).toBeInTheDocument();
  });
});
