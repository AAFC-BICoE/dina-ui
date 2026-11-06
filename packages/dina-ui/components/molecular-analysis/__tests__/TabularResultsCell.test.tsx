import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";
import { mountWithAppContext } from "common-ui";
import { TabularResultsCell } from "../TabularResultsCell";
import { SequencingRunItem } from "../useMolecularAnalysisRun";

const TSV = new File(["a\tb\n1\t2\n3\t4"], "results.tsv", {
  type: "text/tab-separated-values"
});
const CONVERTED = {
  0: {
    rows: [
      { rowNumber: 0, content: ["a", "b"] },
      { rowNumber: 1, content: ["1", "2"] },
      { rowNumber: 2, content: ["3", "4"] }
    ]
  }
};

const mockSave = jest.fn((ops) =>
  ops.map((op) => ({ ...op.resource, id: op?.resource?.id ?? "new-result" }))
);
const mockPost = jest.fn();

function mount(item: SequencingRunItem) {
  const setItems = jest.fn();
  const wrapper = mountWithAppContext(
    <TabularResultsCell
      sequencingRunItem={item}
      setSequencingRunItems={setItems}
    />,
    {
      apiContext: {
        save: mockSave,
        apiClient: { axios: { post: mockPost } }
      } as any
    }
  );
  return { wrapper, setItems };
}

const runItem = (result?: any): SequencingRunItem => ({
  molecularAnalysisRunItemId: "ri-1",
  molecularAnalysisRunItem: {
    id: "ri-1",
    type: "molecular-analysis-run-item",
    usageType: "generic-molecular-analysis-item",
    name: "item-1.raw",
    result
  }
});

async function pickFile(wrapper: ReturnType<typeof mount>["wrapper"]) {
  const input = wrapper.container.querySelector(
    "input[type=file]"
  ) as HTMLInputElement;
  await userEvent.upload(input, TSV);
}

describe("TabularResultsCell", () => {
  beforeEach(jest.clearAllMocks);

  it("creates and links a result when the run item has none", async () => {
    mockPost.mockResolvedValue({ data: CONVERTED });
    const { wrapper, setItems } = mount(runItem());

    await userEvent.click(wrapper.getByRole("button", { name: /upload tsv/i }));
    await pickFile(wrapper);

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));
    expect(mockSave.mock.calls[0][0][0].resource).toEqual(
      expect.objectContaining({
        type: "molecular-analysis-result",
        group: "aafc",
        createdBy: "test-user",
        tabularResults: {
          records: [
            { a: "1", b: "2" },
            { a: "3", b: "4" }
          ]
        }
      })
    );
    expect(mockSave.mock.calls[1][0][0].resource.relationships.result).toEqual({
      data: { id: "new-result", type: "molecular-analysis-result" }
    });
    expect(setItems).toHaveBeenCalled();
  });

  it("shows an error when linking a newly created result fails", async () => {
    mockPost.mockResolvedValue({ data: CONVERTED });
    mockSave
      .mockImplementationOnce((ops) =>
        ops.map((op) => ({
          ...op.resource,
          id: op?.resource?.id ?? "new-result"
        }))
      )
      .mockRejectedValueOnce(new Error("link failed"));
    const { wrapper } = mount(runItem());

    await userEvent.click(wrapper.getByRole("button", { name: /upload tsv/i }));
    await pickFile(wrapper);

    expect(
      await wrapper.findByText(/failed to parse the file/i)
    ).toBeInTheDocument();
    expect(mockSave).toHaveBeenCalledTimes(2);
  });

  it("only updates tabularResults on an existing result", async () => {
    mockPost.mockResolvedValue({ data: CONVERTED });
    const { wrapper } = mount(
      runItem({
        id: "res-1",
        type: "molecular-analysis-result",
        attachments: [{ id: "attachment-1", type: "file" }],
        tabularResults: { records: [{ a: "old", b: "old" }] }
      })
    );

    await userEvent.click(
      wrapper.getByRole("button", { name: /open full table/i })
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: /replace file/i })
    );
    await pickFile(wrapper);

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave.mock.calls[0][0][0].resource).toEqual({
      id: "res-1",
      type: "molecular-analysis-result",
      tabularResults: {
        records: [
          { a: "1", b: "2" },
          { a: "3", b: "4" }
        ]
      }
    });
    expect(mockSave.mock.calls[0][0][0].resource).not.toHaveProperty(
      "attachments"
    );
  });

  it("does not enable upload when the run item is missing", () => {
    const { wrapper } = mount({
      molecularAnalysisRunItemId: "ri-1"
    });

    expect(wrapper.getByRole("button", { name: /upload tsv/i })).toBeDisabled();
  });

  it("shows the selected file while conversion is in progress", async () => {
    let resolveConversion:
      | ((value: { data: typeof CONVERTED }) => void)
      | undefined;
    mockPost.mockImplementation(
      () =>
        new Promise<{ data: typeof CONVERTED }>((resolve) => {
          resolveConversion = resolve;
        })
    );
    const { wrapper } = mount(runItem());

    await userEvent.click(wrapper.getByRole("button", { name: /upload tsv/i }));
    await pickFile(wrapper);

    expect(await wrapper.findByRole("status")).toHaveTextContent("results.tsv");
    expect(mockSave).not.toHaveBeenCalled();

    resolveConversion?.({ data: CONVERTED });
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));
  });

  it("shows an error with Retry and saves nothing when parsing fails", async () => {
    mockPost.mockRejectedValue(new Error("bad file"));
    const { wrapper } = mount(runItem());

    await userEvent.click(wrapper.getByRole("button", { name: /upload tsv/i }));
    await pickFile(wrapper);

    expect(
      await wrapper.findByText(/failed to parse the file/i)
    ).toBeInTheDocument();
    expect(wrapper.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("allows retrying with the same file after a parse failure", async () => {
    mockPost
      .mockRejectedValueOnce(new Error("bad file"))
      .mockResolvedValueOnce({ data: CONVERTED });
    const { wrapper } = mount(runItem());

    await userEvent.click(wrapper.getByRole("button", { name: /upload tsv/i }));
    await pickFile(wrapper);
    await wrapper.findByText(/failed to parse the file/i);

    await userEvent.click(wrapper.getByRole("button", { name: /retry/i }));
    await pickFile(wrapper);

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));
  });

  it("removes tabular results after confirmation without deleting the result", async () => {
    const { wrapper } = mount(
      runItem({
        id: "res-1",
        type: "molecular-analysis-result",
        tabularResults: { records: [{ a: "1", b: "2" }] }
      })
    );

    await userEvent.click(
      wrapper.getByRole("button", { name: /open full table/i })
    );
    await userEvent.click(wrapper.getByRole("button", { name: /^remove$/i }));
    expect(
      wrapper.getByText(/remove the tabular results for this run item/i)
    ).toBeInTheDocument();
    await userEvent.click(
      wrapper.getAllByRole("button", { name: /^remove$/i })[0]
    );

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave.mock.calls[0][0][0].resource).toEqual({
      id: "res-1",
      type: "molecular-analysis-result",
      tabularResults: null
    });
  });

  it("keeps the confirmation open when removing tabular results fails", async () => {
    mockSave.mockRejectedValueOnce(new Error("remove failed"));
    const { wrapper } = mount(
      runItem({
        id: "res-1",
        type: "molecular-analysis-result",
        tabularResults: { records: [{ a: "1", b: "2" }] }
      })
    );

    await userEvent.click(
      wrapper.getByRole("button", { name: /open full table/i })
    );
    await userEvent.click(wrapper.getByRole("button", { name: /^remove$/i }));
    await userEvent.click(
      wrapper.getAllByRole("button", { name: /^remove$/i })[0]
    );

    await waitFor(() =>
      expect(
        wrapper.getByText(/remove the tabular results for this run item/i)
      ).toBeInTheDocument()
    );
  });
});
