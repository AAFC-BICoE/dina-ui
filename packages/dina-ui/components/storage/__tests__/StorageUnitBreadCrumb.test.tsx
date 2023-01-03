import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitBreadCrumb } from "../StorageUnitBreadCrumb";

const storageUnitWithHierarchy: PersistedResource<StorageUnit> = {
  id: "A",
  group: "group",
  name: "A",
  type: "storage-unit",
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

    expect(
      wrapper.find("li.breadcrumb-item").map((node) => node.text().trim())
    ).toEqual(["C (Room)", "B (Cabinet)", "A (Box)"]);
    expect(wrapper.find("a").map((node) => node.prop("href"))).toEqual([
      "/collection/storage-unit/view?id=C",
      "/collection/storage-unit/view?id=B",
      "/collection/storage-unit/view?id=A"
    ]);
  });
  it("Renders the breadcrumb path from the parent's hierarchy", async () => {
    const wrapper = mountWithAppContext(
      <StorageUnitBreadCrumb storageUnit={storageUnitWithParentHierarchy} />
    );

    expect(
      wrapper.find("li.breadcrumb-item").map((node) => node.text().trim())
    ).toEqual(["C (Room)", "B (Cabinet)", "A (Box)"]);
    expect(wrapper.find("a").map((node) => node.prop("href"))).toEqual([
      "/collection/storage-unit/view?id=C",
      "/collection/storage-unit/view?id=B",
      "/collection/storage-unit/view?id=A"
    ]);
  });
});
