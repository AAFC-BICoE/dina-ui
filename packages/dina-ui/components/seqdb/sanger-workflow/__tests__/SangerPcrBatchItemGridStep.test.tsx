import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { PcrBatch } from "../../../../../dina-ui/types/seqdb-api";
import { PCRBatchItemGrid } from "../pcr-batch-plating-step/SangerPcrBatchItemGridStep";
import { noop } from "lodash";

const PCR_BATCH_ID = "pcr-batch-id";
const PCR_BATCH_ITEM_ID_1 = "pcr-batch-item-id-1";
const PCR_BATCH_ITEM_ID_2 = "pcr-batch-item-id-2";
const PCR_BATCH_ITEM_ID_3 = "pcr-batch-item-id-3";

const MATERIAL_SAMPLE_ID_1 = "material-sample-id-1";
const MATERIAL_SAMPLE_ID_2 = "material-sample-id-2";
const MATERIAL_SAMPLE_ID_3 = "material-sample-id-3";

const MATERIAL_SAMPLE_NAME_1 = "Name 1";
const MATERIAL_SAMPLE_NAME_2 = "Name 2";
const MATERIAL_SAMPLE_NAME_3 = "Name 3";

const PCR_BATCH: PcrBatch = {
  name: "pcr-batch-name",
  type: "pcr-batch",
  id: PCR_BATCH_ID,
  storageRestriction: {
    layout: {
      numberOfColumns: 5,
      numberOfRows: 5,
      fillDirection: "BY_COLUMN"
    }
  }
};

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "/seqdb-api/pcr-batch-item":
      return {
        data: [
          {
            id: PCR_BATCH_ITEM_ID_1,
            type: "pcr-batch-item",
            createdBy: "dina-admin",
            group: "aafc",
            wellColumn: null,
            wellRow: null,
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
            wellColumn: null,
            wellRow: null,
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
            wellColumn: null,
            wellRow: null,
            materialSample: {
              id: MATERIAL_SAMPLE_ID_3,
              type: "material-sample"
            }
          }
        ]
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
    }
  });
});

const testCtx = {
  apiContext: {
    apiClient: { get: mockGet },
    bulkGet: mockBulkGet
  }
};

describe("SangerPcrBatchItemGridStep component", () => {
  it("Display material samples in selection list", async () => {
    const wrapper = mountWithAppContext(
      <PCRBatchItemGrid
        pcrBatch={PCR_BATCH}
        pcrBatchId={PCR_BATCH_ID}
        editMode={false}
        setEditMode={noop}
        performSave={false}
        setPerformSave={noop}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".available-sample-list").children()).toHaveLength(3);
  });

  it("Switch between view and edit mode", async () => {
    const wrapper = mountWithAppContext(
      <PCRBatchItemGrid
        pcrBatch={PCR_BATCH}
        pcrBatchId={PCR_BATCH_ID}
        editMode={false}
        setEditMode={noop}
        performSave={false}
        setPerformSave={noop}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Read only mode, certain buttons should be hidden from the user.
    expect(wrapper.find(".move-all").exists()).toBeFalsy();
    expect(wrapper.find(".grid-clear").exists()).toBeFalsy();

    // Switch to edit mode.
    wrapper.setProps({
      children: (
        <PCRBatchItemGrid
          pcrBatch={PCR_BATCH}
          pcrBatchId={PCR_BATCH_ID}
          editMode={true}
          setEditMode={noop}
          performSave={false}
          setPerformSave={noop}
        />
      )
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Read only mode, certain buttons should be hidden from the user.
    expect(wrapper.find(".move-all").exists()).toBeTruthy();
    expect(wrapper.find(".grid-clear").exists()).toBeTruthy();
  });

  it("Pre-populate fill by and grid row and columns", async () => {
    const wrapper = mountWithAppContext(
      <PCRBatchItemGrid
        pcrBatch={PCR_BATCH}
        pcrBatchId={PCR_BATCH_ID}
        editMode={true}
        setEditMode={noop}
        performSave={false}
        setPerformSave={noop}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // The fill by column should be pre-selected.
    expect(wrapper.find(".COLUMN-radio").props()).toHaveProperty("checked");

    // TODO: Check to ensure it's a 5 by 5 grid being rendered.
  });

  // it("Move all functionality and save", async () => {});

  // it("Clear grid and save", async () => {});

  // it("Display message if no storage unit is provided on PcrBatch", async () => {});
});
