import { Formik } from "formik";
import { noop } from "lodash";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { BulkDataEditor } from "../BulkDataEditor";

interface TestRow {
  a: string;
  b: string;
  c: string;
  id: string;
}

const mockOnSubmit = jest.fn();

// Mock out the HandsOnTable which should only be rendered in the browser.
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div>Mock dynamic component</div>;
  };
});

describe("BulkDataEditor component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Submits the diff of the changed data.", async () => {
    const data: TestRow[] = [
      { a: "a-value", b: "b-value", c: "c-value", id: "1" },
      { a: "a-value", b: "b-value", c: "c-value", id: "2" },
      { a: "a-value", b: "b-value", c: "c-value", id: "3" }
    ];

    async function loadData() {
      return data;
    }

    const wrapper = mountWithAppContext(
      <Formik initialValues={{ testFormikAttr: "test value" }} onSubmit={noop}>
        <BulkDataEditor
          columns={[
            { data: "a", title: "A" },
            { data: "b", title: "B" },
            { data: "c", title: "C" }
          ]}
          loadData={loadData}
          onSubmit={mockOnSubmit}
        />
      </Formik>
    );

    // Await initial data load
    await new Promise(setImmediate);
    wrapper.update();

    const workingData = wrapper
      .find("MockDynamicComponent")
      .prop<TestRow[]>("data");

    workingData[1].b = "New value";

    wrapper.find("button.bulk-editor-submit-button").simulate("click");

    expect(mockOnSubmit).lastCalledWith(
      [
        // Only the changed row is submitted:
        {
          changes: {
            b: "New value"
          },
          original: {
            a: "a-value",
            b: "b-value",
            c: "c-value",
            id: "2"
          }
        }
      ],
      { testFormikAttr: "test value" },
      expect.anything()
    );
  });
});
