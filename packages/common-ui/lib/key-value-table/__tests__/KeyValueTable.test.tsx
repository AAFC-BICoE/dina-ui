import { mountWithAppContext } from "../../test-util/mock-app-context";
import { KeyValueTable } from "../KeyValueTable";
import "@testing-library/jest-dom";

describe("KeyValueTable component", () => {
  it("Renders the object's keys and values", () => {
    const object = {
      keyA: "value A",
      keyB: "value B"
    };

    const wrapper = mountWithAppContext(<KeyValueTable data={object} />);

    expect(wrapper.queryByText("Key A")).toBeInTheDocument();
    expect(wrapper.queryByText("Key B")).toBeInTheDocument();

    expect(wrapper.queryByText("value A")).toBeInTheDocument();
    expect(wrapper.queryByText("value B")).toBeInTheDocument();
  });

  it("Renders custom value cells", () => {
    const object = {
      keyA: "value A",
      keyB: "value B"
    };

    const wrapper = mountWithAppContext(
      <KeyValueTable
        customValueCells={{
          keyB: ({ getValue }) => getValue().toUpperCase()
        }}
        data={object}
      />
    );

    // keyA unaffected:
    expect(wrapper.queryByText("value A")).toBeInTheDocument();

    // keyB uppercased:
    expect(wrapper.queryByText("VALUE B")).toBeInTheDocument();
  });
});
