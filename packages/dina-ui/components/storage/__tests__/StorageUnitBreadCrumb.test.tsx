import { PersistedResource } from "kitsu";
import {
  mountWithAppContext,
  mountWithAppContext2
} from "../../../test-util/mock-app-context";
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitBreadCrumb } from "../StorageUnitBreadCrumb";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { render } from "enzyme";

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
    const tooltip = wrapper.find("Tooltip");

    const directComponent: any[] = tooltip.prop("directComponent");
    expect(directComponent.length).toEqual(3);

    const hrefs = directComponent.map((fragment) => {
      return fragment.props.children[0].props.href;
    });
    expect(hrefs).toEqual([
      "/collection/storage-unit/view?id=C",
      "/collection/storage-unit/view?id=B",
      "/collection/storage-unit/view?id=A"
    ]);
    const texts = directComponent.map((fragment) => {
      return fragment.props.children[0].props.children.props.children;
    });
    expect(texts).toEqual(["C (Room)", "B (Cabinet)", "A (Box)"]);
  });
  it("Renders the breadcrumb path from the parent's hierarchy", async () => {
    const wrapper = mountWithAppContext(
      <StorageUnitBreadCrumb storageUnit={storageUnitWithParentHierarchy} />
    );

    const tooltip = wrapper.find("Tooltip");

    const directComponent: any[] = tooltip.prop("directComponent");
    expect(directComponent.length).toEqual(3);

    const hrefs = directComponent.map((fragment) => {
      return fragment.props.children[0].props.href;
    });
    expect(hrefs).toEqual([
      "/collection/storage-unit/view?id=C",
      "/collection/storage-unit/view?id=B",
      "/collection/storage-unit/view?id=A"
    ]);

    const texts = directComponent.map((fragment) => {
      return fragment.props.children[0].props.children.props.children;
    });
    expect(texts).toEqual(["C (Room)", "B (Cabinet)", "A (Box)"]);
  });
});
