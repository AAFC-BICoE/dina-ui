import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DeleteButton } from "../DeleteButton";
import { fireEvent, waitForElementToBeRemoved } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockDoOperations = jest.fn();

const apiContext = { doOperations: mockDoOperations };

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

    // Find the delete button using a query method
    const deleteButton = wrapper.getByRole("button", { name: /delete/i });

    // Click the button.
    fireEvent.click(deleteButton);

    // Click Yes:
    const yesButton = wrapper.getByRole("button", { name: /yes/i });
    fireEvent.click(yesButton);

    // Wait for the loading to be removed.
    await waitForElementToBeRemoved(wrapper.getAllByText(/loading\.\.\./i));

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

    // Expect the button not to be rendered...
    expect(wrapper.queryByRole("button", { name: /delete/i })).toBeNull();
  });
});
