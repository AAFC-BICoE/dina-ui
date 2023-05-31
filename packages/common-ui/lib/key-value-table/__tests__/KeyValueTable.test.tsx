import { mountWithAppContext } from "../../test-util/mock-app-context";
import { KeyValueTable } from "../KeyValueTable";

describe("KeyValueTable component", () => {
  it("Renders the object's keys and values", () => {
    const object = {
      keyA: "value A",
      keyB: "value B"
    };

    const wrapper = mountWithAppContext(<KeyValueTable data={object} />);

    expect(wrapper.find(".key-cell").at(0).text()).toEqual("Key A");
    expect(wrapper.find(".key-cell").at(1).text()).toEqual("Key B");

    expect(wrapper.find(".value-cell").at(0).text()).toEqual("value A");
    expect(wrapper.find(".value-cell").at(1).text()).toEqual("value B");
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
    expect(wrapper.find(".value-cell").at(0).text()).toEqual("value A");

    // keyB uppercased:
    expect(wrapper.find(".value-cell").at(1).text()).toEqual("VALUE B");
  });
});
