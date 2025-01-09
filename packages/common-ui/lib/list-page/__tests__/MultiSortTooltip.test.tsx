import { mountWithAppContext } from "common-ui";
import { MultiSortTooltip } from "../MultiSortTooltip";

describe("MultiSortTooltip", () => {
  test("Snapshot test", async () => {
    const wrapper = mountWithAppContext(<MultiSortTooltip />);
    expect(wrapper.asFragment()).toMatchSnapshot();
  });
});
