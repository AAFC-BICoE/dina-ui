import { mountWithAppContext2 } from "../../test-util/mock-app-context";
import { MultiSortTooltip } from "../MultiSortTooltip";

describe("MultiSortTooltip", () => {
  test("Snapshot test", async () => {
    const wrapper = mountWithAppContext2(<MultiSortTooltip />);
    expect(wrapper.asFragment()).toMatchSnapshot();
  });
});
