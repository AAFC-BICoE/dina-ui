import { mountWithAppContext } from "../../test-util/mock-app-context";
import { MultiSortTooltip } from "../MultiSortTooltip";

describe("MultiSortTooltip", () => {
  test("Snapshot test", async () => {
    const wrapper = mountWithAppContext(<MultiSortTooltip />);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
