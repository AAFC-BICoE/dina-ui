import { mountWithAppContext } from "common-ui";
import { AreYouSureModalDelete } from "../AreYouSureModalDelete";
import { personRelationshipFields } from "../types";
import { useModal } from "../modal";
import { fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockYesClick = jest.fn();

const TEST_METADATA = {
  filename: "file a",
  id: "4",
  type: "metadata",
  uuid: "11111111-2222-2222-3333-333333333333"
};
const TEST_MATERIAL_SAMPLE = {
  materialSampleName: "sample a",
  id: "2",
  type: "material-sample",
  uuid: "55555555-6666-6666-7777-777777777777"
};

const TEST_EXPEDITION = {
  name: "expedition_test",
  id: "3",
  type: "expedition",
  uuid: "88888888-9999-aaaa-bbbb-bbbbbbbbbbbb"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (query) => {
  switch (query) {
    case "objectstore-api/metadata":
      return { data: [TEST_METADATA] };
    case "collection-api/material-sample":
      return { data: [TEST_MATERIAL_SAMPLE] };
    case "collection-api/expedition":
      return { data: [TEST_EXPEDITION] };
    default:
      return { data: [] };
  }
});

const apiContext: any = {
  apiClient: { get: mockGet }
};

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "11111111-2222-2222-3333-333333335555" } })
}));

function TestComponent() {
  const { closeModal, openModal } = useModal();

  return (
    <>
      <button
        className="open-modal"
        onClick={() =>
          openModal(
            <AreYouSureModalDelete
              actionMessage="Test Message"
              onYesButtonClicked={mockYesClick}
              relationshipFields={personRelationshipFields}
            />
          )
        }
      >
        Open
      </button>
      <button className="close-modal" onClick={closeModal}>
        Close
      </button>
    </>
  );
}

describe("AreYouSureModalDelete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Closes when you click 'No'", async () => {
    const wrapper = mountWithAppContext(<TestComponent />, { apiContext });

    // Should not be open by default on initial load.
    expect(wrapper.queryByText(/test message/i)).not.toBeInTheDocument();

    // Open modal:
    fireEvent.click(wrapper.getByRole("button", { name: /open/i }));

    // Ensure the test message is displayed.
    expect(wrapper.getByText(/test message/i)).toBeInTheDocument();

    // Click 'no':
    fireEvent.click(wrapper.getByRole("button", { name: /no/i }));

    // Should be closed now:
    expect(wrapper.queryByText(/test message/i)).not.toBeInTheDocument();
  });

  it("Runs the passed function and closes when you click 'Yes'", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    // Open modal:
    fireEvent.click(wrapper.getByRole("button", { name: /open/i }));

    // Ensure the test message is displayed.
    expect(wrapper.getByText(/test message/i)).toBeInTheDocument();

    // Click 'yes':
    fireEvent.click(wrapper.getByRole("button", { name: /yes/i }));

    // Should have run the function:
    await waitFor(() => {
      expect(mockYesClick).toHaveBeenCalledTimes(1);
    });

    // Should be closed now:
    expect(wrapper.queryByText(/test message/i)).not.toBeInTheDocument();
  });

  it("Shows related objects and closes modal after clicking on object link.", async () => {
    const wrapper = mountWithAppContext(<TestComponent />, { apiContext });

    // Open modal:
    fireEvent.click(wrapper.getByRole("button", { name: /open/i }));

    // Ensure the test message is displayed.
    expect(wrapper.getByText(/test message/i)).toBeInTheDocument();

    // Ensure related objects are displayed:
    await waitFor(() => {
      expect(
        screen.getByRole("link", {
          name: /file a/i
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", {
          name: /sample a/i
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", {
          name: /expedition/i
        })
      ).toBeInTheDocument();
      expect(screen.getByText(/metadata/i)).toBeInTheDocument();
      expect(screen.getByText(/material\-sample/i)).toBeInTheDocument();
      expect(screen.getByText(/expedition_test/i)).toBeInTheDocument();
    });

    // Click 'yes' on one of the related objects:
    fireEvent.click(
      screen.getByRole("link", {
        name: /expedition/i
      })
    );

    // Expect the modal to be closed.
    waitFor(() => {
      expect(mockYesClick).toHaveBeenCalled();
      // Should be closed now:
      expect(wrapper.queryByText(/test message/i)).not.toBeInTheDocument();
    });
  });
});
