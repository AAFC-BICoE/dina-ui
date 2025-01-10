import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "common-ui";
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitBreadCrumb } from "../StorageUnitBreadCrumb";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

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
    userEvent.hover(wrapper.getByRole("img"));
    await new Promise(setImmediate);

    // Test tooltip rendering while hovering on the img element
    expect(
      wrapper.getByRole("tooltip", {
        name: /c \(room\) > b \(cabinet\) > a \(box\)/i
      })
    ).toBeInTheDocument();

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
    userEvent.hover(wrapper.getByRole("img"));
    await new Promise(setImmediate);

    // Test tooltip rendering while hovering on the img element
    expect(
      wrapper.getByRole("tooltip", {
        name: /c \(room\) > b \(cabinet\) > a \(box\)/i
      })
    ).toBeInTheDocument();

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
});
