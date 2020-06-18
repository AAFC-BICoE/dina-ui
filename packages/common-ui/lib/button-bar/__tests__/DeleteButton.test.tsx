import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DeleteButton } from "../DeleteButton";

const mockDoOperations = jest.fn();

const apiContext = { doOperations: mockDoOperations } as any;

const mockPush = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush })
}));

describe("DeleteButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Deletes the resource and then redirects to another page.", async () => {
    const wrapper = mountWithAppContext(
      <DeleteButton
        id="100"
        type="metadata"
        postDeleteRedirect="/metadata/list"
      />,
      { apiContext }
    );

    // Open modal:
    wrapper.find("button.delete-button").simulate("click");
    wrapper.update();

    // Click Yes:
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    expect(mockDoOperations).lastCalledWith(
      [
        {
          op: "DELETE",
          path: "metadata/100"
        }
      ],
      undefined
    );
    expect(mockPush).lastCalledWith("/metadata/list");
  });

  it("Renders blank if the passed ID is undefined.", () => {
    const wrapper = mountWithAppContext(
      <DeleteButton type="metadata" postDeleteRedirect="/metadata/list" />,
      { apiContext }
    );

    expect(wrapper.html()).toEqual("");
  });
});
