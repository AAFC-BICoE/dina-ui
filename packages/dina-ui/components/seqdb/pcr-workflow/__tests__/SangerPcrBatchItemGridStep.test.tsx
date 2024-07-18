import { StorageUnit } from "../../../../types/collection-api";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { PcrBatch, PcrBatchItem } from "../../../../types/seqdb-api";
import { SangerPcrBatchItemGridStep } from "../pcr-batch-plating-step/SangerPcrBatchItemGridStep";
import { noop } from "lodash";

const PCR_BATCH_ID = "pcr-batch-id";
const PCR_BATCH_ITEM_ID_1 = "pcr-batch-item-id-1";
const PCR_BATCH_ITEM_ID_2 = "pcr-batch-item-id-2";
const PCR_BATCH_ITEM_ID_3 = "pcr-batch-item-id-3";
const PCR_BATCH_ITEM_ID_4 = "pcr-batch-item-id-4";
const PCR_BATCH_ITEM_ID_5 = "pcr-batch-item-id-5";

const MATERIAL_SAMPLE_ID_1 = "material-sample-id-1";
const MATERIAL_SAMPLE_ID_2 = "material-sample-id-2";
const MATERIAL_SAMPLE_ID_3 = "material-sample-id-3";
const MATERIAL_SAMPLE_ID_4 = "material-sample-id-4";
const MATERIAL_SAMPLE_ID_5 = "material-sample-id-5";

const MATERIAL_SAMPLE_NAME_1 = "Name 1";
const MATERIAL_SAMPLE_NAME_2 = "Name 2";
const MATERIAL_SAMPLE_NAME_3 = "Name 3";
const MATERIAL_SAMPLE_NAME_4 = "Name 4";
const MATERIAL_SAMPLE_NAME_5 = "Name 5";

const STORAGE_UNIT_USAGE_ID_4 = "storage-unit-usage-4";
const STORAGE_UNIT_USAGE_ID_5 = "storage-unit-usage-5";

const GRID_ROW_SIZE = 5;
const GRID_COL_SIZE = 8;

let STORAGE_UNIT_1: StorageUnit = {
  id: "storage-unit-1",
  type: "storage-unit",
  name: "storage unit 1",
  group: "aafc",
  storageUnitType: {
    type: "storage-unit-type",
    name: "storage unit type 1",
    group: "aafc",
    gridLayoutDefinition: {
      numberOfColumns: GRID_COL_SIZE,
      numberOfRows: GRID_ROW_SIZE,
      fillDirection: "BY_COLUMN"
    }
  }
};

let STORAGE_UNIT_USAGE_4 = {
  id: STORAGE_UNIT_USAGE_ID_4,
  type: "storage-unit-usage",
  wellColumn: 1,
  wellRow: "A"
};
let STORAGE_UNIT_USAGE_5 = {
  id: STORAGE_UNIT_USAGE_ID_5,
  type: "storage-unit-usage",
  wellColumn: 2,
  wellRow: "A"
};

let PCR_BATCH: PcrBatch = {
  name: "pcr-batch-name",
  type: "pcr-batch",
  isCompleted: false,
  id: PCR_BATCH_ID,
  storageRestriction: {
    layout: {
      numberOfColumns: GRID_COL_SIZE,
      numberOfRows: GRID_ROW_SIZE,
      fillDirection: "BY_COLUMN"
    }
  },
  storageUnit: STORAGE_UNIT_1 as any
};

let PCR_BATCH_NO_STORAGE: PcrBatch = {
  name: "pcr-batch-name",
  type: "pcr-batch",
  isCompleted: false,
  id: PCR_BATCH_ID
};

let PCR_BATCH_ITEMS: PcrBatchItem[] = [
  {
    id: PCR_BATCH_ITEM_ID_1,
    type: "pcr-batch-item",
    createdBy: "dina-admin",
    group: "aafc",
    materialSample: {
      id: MATERIAL_SAMPLE_ID_1,
      type: "material-sample"
    }
  },
  {
    id: PCR_BATCH_ITEM_ID_2,
    type: "pcr-batch-item",
    createdBy: "dina-admin",
    group: "aafc",
    materialSample: {
      id: MATERIAL_SAMPLE_ID_2,
      type: "material-sample"
    }
  },
  {
    id: PCR_BATCH_ITEM_ID_3,
    type: "pcr-batch-item",
    createdBy: "dina-admin",
    group: "aafc",
    materialSample: {
      id: MATERIAL_SAMPLE_ID_3,
      type: "material-sample"
    }
  },
  {
    id: PCR_BATCH_ITEM_ID_4,
    type: "pcr-batch-item",
    createdBy: "dina-admin",
    group: "aafc",
    storageUnitUsage: {
      id: STORAGE_UNIT_USAGE_ID_4,
      type: "storage-unit-usage"
    },
    materialSample: {
      id: MATERIAL_SAMPLE_ID_4,
      type: "material-sample"
    }
  },
  {
    id: PCR_BATCH_ITEM_ID_5,
    type: "pcr-batch-item",
    createdBy: "dina-admin",
    group: "aafc",
    storageUnitUsage: {
      id: STORAGE_UNIT_USAGE_ID_5,
      type: "storage-unit-usage"
    },
    materialSample: {
      id: MATERIAL_SAMPLE_ID_5,
      type: "material-sample"
    }
  }
];
const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "/seqdb-api/pcr-batch-item":
      return {
        data: PCR_BATCH_ITEMS
      };
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) => {
  return paths.map((path) => {
    switch (path) {
      case "/material-sample/" + MATERIAL_SAMPLE_ID_1:
        return {
          id: MATERIAL_SAMPLE_ID_1,
          type: "material-sample",
          materialSampleName: MATERIAL_SAMPLE_NAME_1
        };
      case "/material-sample/" + MATERIAL_SAMPLE_ID_2:
        return {
          id: MATERIAL_SAMPLE_ID_2,
          type: "material-sample",
          materialSampleName: MATERIAL_SAMPLE_NAME_2
        };
      case "/material-sample/" + MATERIAL_SAMPLE_ID_3:
        return {
          id: MATERIAL_SAMPLE_ID_3,
          type: "material-sample",
          materialSampleName: MATERIAL_SAMPLE_NAME_3
        };
      case "/material-sample/" + MATERIAL_SAMPLE_ID_4:
        return {
          id: MATERIAL_SAMPLE_ID_4,
          type: "material-sample",
          materialSampleName: MATERIAL_SAMPLE_NAME_4
        };
      case "/material-sample/" + MATERIAL_SAMPLE_ID_5:
        return {
          id: MATERIAL_SAMPLE_ID_5,
          type: "material-sample",
          materialSampleName: MATERIAL_SAMPLE_NAME_5
        };
      case "/storage-unit-usage/" + STORAGE_UNIT_USAGE_ID_4:
        return STORAGE_UNIT_USAGE_4;
      case "/storage-unit-usage/" + STORAGE_UNIT_USAGE_ID_5:
        return STORAGE_UNIT_USAGE_5;
    }
  });
});

const mockSave = jest.fn();

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet
    },
    bulkGet: mockBulkGet,
    save: mockSave
  }
};

const mockOnSaved = jest.fn();

describe("SangerPcrBatchItemGridStep component", () => {
  beforeEach(jest.clearAllMocks);
  afterEach(() => {
    STORAGE_UNIT_1 = {
      id: "storage-unit-1",
      type: "storage-unit",
      name: "storage unit 1",
      group: "aafc",
      storageUnitType: {
        type: "storage-unit-type",
        name: "storage unit type 1",
        group: "aafc",
        gridLayoutDefinition: {
          numberOfColumns: GRID_COL_SIZE,
          numberOfRows: GRID_ROW_SIZE,
          fillDirection: "BY_COLUMN"
        }
      }
    };

    STORAGE_UNIT_USAGE_4 = {
      id: STORAGE_UNIT_USAGE_ID_4,
      type: "storage-unit-usage",
      wellColumn: 1,
      wellRow: "A"
    };
    STORAGE_UNIT_USAGE_5 = {
      id: STORAGE_UNIT_USAGE_ID_5,
      type: "storage-unit-usage",
      wellColumn: 2,
      wellRow: "A"
    };

    PCR_BATCH = {
      name: "pcr-batch-name",
      type: "pcr-batch",
      isCompleted: false,
      id: PCR_BATCH_ID,
      storageRestriction: {
        layout: {
          numberOfColumns: GRID_COL_SIZE,
          numberOfRows: GRID_ROW_SIZE,
          fillDirection: "BY_COLUMN"
        }
      },
      storageUnit: STORAGE_UNIT_1 as any
    };

    PCR_BATCH_NO_STORAGE = {
      name: "pcr-batch-name",
      type: "pcr-batch",
      isCompleted: false,
      id: PCR_BATCH_ID
    };

    PCR_BATCH_ITEMS = [
      {
        id: PCR_BATCH_ITEM_ID_1,
        type: "pcr-batch-item",
        createdBy: "dina-admin",
        group: "aafc",
        materialSample: {
          id: MATERIAL_SAMPLE_ID_1,
          type: "material-sample"
        }
      },
      {
        id: PCR_BATCH_ITEM_ID_2,
        type: "pcr-batch-item",
        createdBy: "dina-admin",
        group: "aafc",
        materialSample: {
          id: MATERIAL_SAMPLE_ID_2,
          type: "material-sample"
        }
      },
      {
        id: PCR_BATCH_ITEM_ID_3,
        type: "pcr-batch-item",
        createdBy: "dina-admin",
        group: "aafc",
        materialSample: {
          id: MATERIAL_SAMPLE_ID_3,
          type: "material-sample"
        }
      },
      {
        id: PCR_BATCH_ITEM_ID_4,
        type: "pcr-batch-item",
        createdBy: "dina-admin",
        group: "aafc",
        storageUnitUsage: {
          id: STORAGE_UNIT_USAGE_ID_4,
          type: "storage-unit-usage"
        },
        materialSample: {
          id: MATERIAL_SAMPLE_ID_4,
          type: "material-sample"
        }
      },
      {
        id: PCR_BATCH_ITEM_ID_5,
        type: "pcr-batch-item",
        createdBy: "dina-admin",
        group: "aafc",
        storageUnitUsage: {
          id: STORAGE_UNIT_USAGE_ID_5,
          type: "storage-unit-usage"
        },
        materialSample: {
          id: MATERIAL_SAMPLE_ID_5,
          type: "material-sample"
        }
      }
    ];
  });

  it("Display material samples in selection list", async () => {
    const wrapper = mountWithAppContext(
      <SangerPcrBatchItemGridStep
        pcrBatch={PCR_BATCH}
        pcrBatchId={PCR_BATCH_ID}
        editMode={false}
        setEditMode={noop}
        performSave={false}
        setPerformSave={noop}
        onSaved={jest.fn()}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".alert").exists()).toBeFalsy();

    // Expect material sample list to be populated with material samples not in the container yet.
    expect(wrapper.find(".available-sample-list").children()).toHaveLength(3);
    expect(wrapper.find(".available-sample-list li").at(0).text()).toEqual(
      MATERIAL_SAMPLE_NAME_1
    );
    expect(wrapper.find(".available-sample-list li").at(1).text()).toEqual(
      MATERIAL_SAMPLE_NAME_2
    );
    expect(wrapper.find(".available-sample-list li").at(2).text()).toEqual(
      MATERIAL_SAMPLE_NAME_3
    );

    // Expect material samples already saved to the grid to be rendered on it.
    expect(wrapper.find(".well-A_1").find(".sample-box-text").text()).toEqual(
      MATERIAL_SAMPLE_NAME_4
    );
    expect(wrapper.find(".well-A_2").find(".sample-box-text").text()).toEqual(
      MATERIAL_SAMPLE_NAME_5
    );
  });

  it("Switch between view and edit mode", async () => {
    const wrapper = mountWithAppContext(
      <SangerPcrBatchItemGridStep
        pcrBatch={PCR_BATCH}
        pcrBatchId={PCR_BATCH_ID}
        editMode={false}
        setEditMode={noop}
        performSave={false}
        setPerformSave={noop}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Read only mode, certain buttons should be hidden from the user.
    expect(wrapper.find(".move-all").exists()).toBeFalsy();
    expect(wrapper.find(".grid-clear").exists()).toBeFalsy();
    expect(wrapper.find(".fill-by").exists()).toBeFalsy();

    // Switch to edit mode.
    wrapper.setProps({
      children: (
        <SangerPcrBatchItemGridStep
          pcrBatch={PCR_BATCH}
          pcrBatchId={PCR_BATCH_ID}
          editMode={true}
          setEditMode={noop}
          performSave={false}
          setPerformSave={noop}
          onSaved={mockOnSaved}
        />
      )
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Read only mode, certain buttons should be hidden from the user.
    expect(wrapper.find(".move-all").exists()).toBeTruthy();
    expect(wrapper.find(".grid-clear").exists()).toBeTruthy();
    expect(wrapper.find(".fill-by").exists()).toBeTruthy();
  });

  it("Pre-populate fill by and grid row and columns", async () => {
    const wrapper = mountWithAppContext(
      <SangerPcrBatchItemGridStep
        pcrBatch={PCR_BATCH}
        pcrBatchId={PCR_BATCH_ID}
        editMode={false}
        setEditMode={noop}
        performSave={false}
        setPerformSave={noop}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Switch to edit mode.
    wrapper.setProps({
      children: (
        <SangerPcrBatchItemGridStep
          pcrBatch={PCR_BATCH}
          pcrBatchId={PCR_BATCH_ID}
          editMode={true}
          setEditMode={noop}
          performSave={false}
          setPerformSave={noop}
          onSaved={mockOnSaved}
        />
      )
    });

    await new Promise(setImmediate);
    wrapper.update();

    // The fill by column should be pre-selected.
    expect(wrapper.find(".COLUMN-radio").props()).toHaveProperty("checked");

    // Should be 8 (+1 for the column displaying the row letters)
    expect(wrapper.find("thead tr").children()).toHaveLength(GRID_COL_SIZE + 1);

    // Should be 5 (React Table renders the header separately so it's not counted here.)
    expect(wrapper.find("tbody").children()).toHaveLength(GRID_ROW_SIZE);
  });

  it("Move all functionality", async () => {
    const wrapper = mountWithAppContext(
      <SangerPcrBatchItemGridStep
        pcrBatch={PCR_BATCH}
        pcrBatchId={PCR_BATCH_ID}
        editMode={false}
        setEditMode={noop}
        performSave={false}
        setPerformSave={noop}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Switch to edit mode.
    wrapper.setProps({
      children: (
        <SangerPcrBatchItemGridStep
          pcrBatch={PCR_BATCH}
          pcrBatchId={PCR_BATCH_ID}
          editMode={true}
          setEditMode={noop}
          performSave={false}
          setPerformSave={noop}
          onSaved={mockOnSaved}
        />
      )
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Clear the grid first, cannot move with items in the grid.
    wrapper.find(".grid-clear").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Click the "Move All" button.
    wrapper.find(".move-all").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Expect the results to fill by column.
    expect(wrapper.find(".well-A_1").find(".sample-box-text").text()).toEqual(
      MATERIAL_SAMPLE_NAME_1
    );
    expect(wrapper.find(".well-B_1").find(".sample-box-text").text()).toEqual(
      MATERIAL_SAMPLE_NAME_2
    );
    expect(wrapper.find(".well-C_1").find(".sample-box-text").text()).toEqual(
      MATERIAL_SAMPLE_NAME_3
    );

    // Click the fill by row and try moving it again.
    wrapper.find(".ROW-radio").simulate("click");

    // Clear the grid first, cannot move with items in the grid.
    wrapper.find(".grid-clear").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Click the "Move All" button.
    wrapper.find(".move-all").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Expect the results to fill by column.
    expect(wrapper.find(".well-A_1").find(".sample-box-text").text()).toEqual(
      MATERIAL_SAMPLE_NAME_1
    );
    expect(wrapper.find(".well-A_2").find(".sample-box-text").text()).toEqual(
      MATERIAL_SAMPLE_NAME_2
    );
    expect(wrapper.find(".well-A_3").find(".sample-box-text").text()).toEqual(
      MATERIAL_SAMPLE_NAME_3
    );

    // Save the container...
    wrapper.setProps({
      children: (
        <SangerPcrBatchItemGridStep
          pcrBatch={PCR_BATCH}
          pcrBatchId={PCR_BATCH_ID}
          editMode={true}
          setEditMode={noop}
          performSave={true} // Perform save...
          setPerformSave={noop}
          onSaved={mockOnSaved}
        />
      )
    });

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            id: STORAGE_UNIT_USAGE_ID_4,
            type: "storage-unit-usage",
            wellColumn: 4,
            wellRow: "A",
            storageUnit: STORAGE_UNIT_1,
            usageType: "pcr-batch-item"
          },
          type: "storage-unit-usage"
        },
        {
          resource: {
            id: "storage-unit-usage-5",
            type: "storage-unit-usage",
            wellColumn: 5,
            wellRow: "A",
            storageUnit: STORAGE_UNIT_1,
            usageType: "pcr-batch-item"
          },
          type: "storage-unit-usage"
        },
        {
          resource: {
            id: undefined,
            type: "storage-unit-usage",
            wellColumn: 1,
            wellRow: "A",
            storageUnit: STORAGE_UNIT_1,
            usageType: "pcr-batch-item"
          },
          type: "storage-unit-usage"
        },
        {
          resource: {
            id: undefined,
            type: "storage-unit-usage",
            wellColumn: 2,
            wellRow: "A",
            storageUnit: STORAGE_UNIT_1,
            usageType: "pcr-batch-item"
          },
          type: "storage-unit-usage"
        },
        {
          resource: {
            id: undefined,
            type: "storage-unit-usage",
            wellColumn: 3,
            wellRow: "A",
            storageUnit: STORAGE_UNIT_1,
            usageType: "pcr-batch-item"
          },
          type: "storage-unit-usage"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
  });

  it("Load existing records and clear grid", async () => {
    const wrapper = mountWithAppContext(
      <SangerPcrBatchItemGridStep
        pcrBatch={PCR_BATCH}
        pcrBatchId={PCR_BATCH_ID}
        editMode={false}
        setEditMode={noop}
        performSave={false}
        setPerformSave={noop}
        onSaved={jest.fn()}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Expect material samples already saved to the grid to be rendered on it.
    expect(wrapper.find(".well-A_1").find(".sample-box-text").text()).toEqual(
      MATERIAL_SAMPLE_NAME_4
    );
    expect(wrapper.find(".well-A_2").find(".sample-box-text").text()).toEqual(
      MATERIAL_SAMPLE_NAME_5
    );

    // Switch to edit mode...
    wrapper.setProps({
      children: (
        <SangerPcrBatchItemGridStep
          pcrBatch={PCR_BATCH}
          pcrBatchId={PCR_BATCH_ID}
          editMode={true}
          setEditMode={noop}
          performSave={false}
          setPerformSave={noop}
          onSaved={mockOnSaved}
        />
      )
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Click the "Clear all" button.
    wrapper.find(".grid-clear").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Save the container...
    wrapper.setProps({
      children: (
        <SangerPcrBatchItemGridStep
          pcrBatch={PCR_BATCH}
          pcrBatchId={PCR_BATCH_ID}
          editMode={true}
          setEditMode={noop}
          performSave={true} // Perform save...
          setPerformSave={noop}
          onSaved={mockOnSaved}
        />
      )
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Only 4 and 5 has been changed and should be in the save request.
    expect(mockSave).lastCalledWith(
      [
        {
          delete: {
            id: "storage-unit-usage-4",
            type: "storage-unit-usage"
          }
        },
        {
          delete: {
            id: "storage-unit-usage-5",
            type: "storage-unit-usage"
          }
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
  });

  it("Display message if no storage unit is provided on PcrBatch", async () => {
    const wrapper = mountWithAppContext(
      <SangerPcrBatchItemGridStep
        pcrBatch={PCR_BATCH_NO_STORAGE}
        pcrBatchId={PCR_BATCH_ID}
        editMode={false}
        setEditMode={noop}
        performSave={false}
        setPerformSave={noop}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Look for alert message.
    expect(wrapper.find(".alert").exists()).toBeTruthy();
  });
});
