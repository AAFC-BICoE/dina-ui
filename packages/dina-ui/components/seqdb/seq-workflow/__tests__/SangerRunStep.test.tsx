import { mountWithAppContext2 } from "../../../../../dina-ui/test-util/mock-app-context";
import { SangerRunStep } from "../SangerRunStep";
import { noop } from "lodash";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("Sanger Run Step from Sanger Workflow", () => {
  beforeEach(jest.clearAllMocks);

  it("Loading spinner is displayed on first load", async () => {
    const wrapper = mountWithAppContext2(
      <SangerRunStep
        editMode={false}
        performSave={false}
        seqBatch={{ isCompleted: false, name: "", type: "seq-batch" }}
        seqBatchId="d107d371-79cc-4939-9fcc-990cb7089fa4"
        setEditMode={noop}
        setPerformSave={noop}
      />
    );

    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });
});
