import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { CollectionSelectField } from "../../resource-select-fields/resource-select-fields";
import Select from "react-select/base";

const COLL1 = {
  id: "1",
  type: "collection",
  name: "col1",
  code: "col1",
  group: "aafc"
};

const COLL2 = {
  id: "2",
  type: "collection",
  name: "col2",
  code: "col2",
  group: "cnc"
};

const ADMIN_GROUP = {
  id: "3",
  type: "collection",
  name: "col3",
  code: "col3",
  group: "admin-group"
};

const mockGet = jest.fn<any, any>(async (path, options) => {
  switch (path) {
    case "collection-api/collection":
      switch (options.filter?.rsql) {
        // For users with 1 group / 1 collection:
        case "group=in=(aafc)":
          return {
            data: [COLL1],
            meta: { totalResourceCount: 1 }
          };
        // For users with 2 groups / 2 collections:
        case "group=in=(aafc,cnc)":
          return {
            data: [COLL1, COLL2],
            meta: { totalResourceCount: 2 }
          };
        // For users with 3 groups / 3 collections:
        default:
          return {
            data: [COLL1, COLL2, ADMIN_GROUP],
            meta: { totalResourceCount: 3 }
          };
      }
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet
    }
  }
};

describe("CollectionSelectField", () => {
  beforeEach(jest.clearAllMocks);

  it("Shows admins all collections to choose from.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <CollectionSelectField name="collection" />
      </DinaForm>,
      { ...testCtx, accountContext: { isAdmin: true } }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Not disabled or filtered:
    expect(wrapper.find(Select).prop("isDisabled")).toEqual(false);
    expect(mockGet.mock.calls).toEqual([
      [
        "collection-api/collection",
        {
          page: { limit: 6 },
          sort: "-createdOn"
        }
      ]
    ]);
  });

  it("Shows non-admin users with one group/collection just their collection", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ collection: COLL1 }}>
        <CollectionSelectField name="collection" />
      </DinaForm>,
      { ...testCtx, accountContext: { groupNames: ["aafc"] } }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(Select).prop("isDisabled")).toEqual(true);
    expect(mockGet.mock.calls).toEqual([
      [
        "collection-api/collection",
        {
          filter: { rsql: "group=in=(aafc)" },
          page: { limit: 6 },
          sort: "-createdOn"
        }
      ]
    ]);
  });

  it("Shows non-admin users with multiple groups/collections all available collections", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ collection: COLL1 }}>
        <CollectionSelectField name="collection" />
      </DinaForm>,
      { ...testCtx, accountContext: { groupNames: ["aafc", "cnc"] } }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(Select).prop("isDisabled")).toEqual(false);
    expect(mockGet.mock.calls).toEqual([
      [
        "collection-api/collection",
        {
          filter: { rsql: "group=in=(aafc,cnc)" },
          page: { limit: 6 },
          sort: "-createdOn"
        }
      ]
    ]);
  });
});
