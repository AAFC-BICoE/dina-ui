import ReindexPage from "../../../pages/admin/reindex";
import { mountWithAppContext } from "common-ui";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app
jest.mock("next/link", () => () => <div />);

const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush })
}));

const VALID_UUID = "01937a05-8b6e-7a4f-9a4b-2f1c1f9a1b2c";

const mockPost = jest.fn();

const apiContext: any = {
  apiClient: { axios: { post: mockPost } }
};

const adminAccount = { isAdmin: true };

const EXPECTED_HEADERS = {
  headers: { "Content-Type": "application/vnd.api+json" }
};

function getSubmittedList() {
  return within(
    screen.getByText("Submitted this session").closest(".card") as HTMLElement
  );
}

function getRequestCard() {
  return within(screen.getByText("Request").closest(".card") as HTMLElement);
}

describe("Reindex Documents page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue({ status: 202 });
  });

  it("Redirects non-admin users to the home page", async () => {
    mountWithAppContext(<ReindexPage />, { apiContext });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
    expect(screen.queryByText("Reindex Documents")).not.toBeInTheDocument();
  });

  it("Reindexes all documents of the default type", async () => {
    mountWithAppContext(<ReindexPage />, {
      apiContext,
      accountContext: adminAccount
    });

    expect(
      getRequestCard().getByText("POST /api/collection-api/index-refresh")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Reindexing all documents can take several minutes/)
    ).toBeInTheDocument();
    expect(
      getSubmittedList().getByText("No requests submitted yet.")
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Reindex All/ }));

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        "collection-api/index-refresh",
        {
          data: {
            type: "index-refresh",
            attributes: { docType: "material-sample" }
          }
        },
        EXPECTED_HEADERS
      )
    );
    expect(await getSubmittedList().findByText("Accepted")).toBeInTheDocument();
    expect(getSubmittedList().getByText("All documents")).toBeInTheDocument();
  });

  it("Updates the type options when the API changes", async () => {
    mountWithAppContext(<ReindexPage />, {
      apiContext,
      accountContext: adminAccount
    });

    await userEvent.click(screen.getByLabelText("API"));
    await userEvent.click(
      screen.getByRole("option", { name: "Object Store API" })
    );

    expect(
      getRequestCard().getByText("POST /api/objectstore-api/index-refresh")
    ).toBeInTheDocument();
    expect(getRequestCard().getByText("metadata")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Reindex All/ }));

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        "objectstore-api/index-refresh",
        {
          data: {
            type: "index-refresh",
            attributes: { docType: "metadata" }
          }
        },
        EXPECTED_HEADERS
      )
    );
  });

  it("Reindexes a single document when a valid UUID is provided", async () => {
    mountWithAppContext(<ReindexPage />, {
      apiContext,
      accountContext: adminAccount
    });

    await userEvent.click(screen.getByLabelText("Single document"));
    const submitButton = screen.getByRole("button", {
      name: /Reindex Document/
    });
    expect(submitButton).toBeDisabled();

    const uuidInput = screen.getByLabelText("Document UUID");
    await userEvent.type(uuidInput, "not-a-uuid");
    expect(screen.getByText("Please enter a valid UUID.")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await userEvent.clear(uuidInput);
    await userEvent.type(uuidInput, VALID_UUID);
    expect(submitButton).toBeEnabled();
    expect(getRequestCard().getByText(VALID_UUID)).toBeInTheDocument();

    await userEvent.click(submitButton);

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        "collection-api/index-refresh",
        {
          data: {
            type: "index-refresh",
            id: VALID_UUID,
            attributes: { docType: "material-sample" }
          }
        },
        EXPECTED_HEADERS
      )
    );
    expect(
      await getSubmittedList().findByText(new RegExp(VALID_UUID))
    ).toBeInTheDocument();
  });

  it("Displays a failed entry when the request is rejected", async () => {
    mockPost.mockRejectedValue({
      response: { status: 400, statusText: "Bad Request" }
    });
    mountWithAppContext(<ReindexPage />, {
      apiContext,
      accountContext: adminAccount
    });

    await userEvent.click(screen.getByRole("button", { name: /Reindex All/ }));

    expect(await getSubmittedList().findByText("Failed")).toBeInTheDocument();
    expect(getSubmittedList().getByText(/400 Bad Request/)).toBeInTheDocument();
  });

  it("Resets the form back to the defaults", async () => {
    mountWithAppContext(<ReindexPage />, {
      apiContext,
      accountContext: adminAccount
    });

    await userEvent.click(screen.getByLabelText("API"));
    await userEvent.click(screen.getByRole("option", { name: "Agent API" }));
    await userEvent.click(screen.getByLabelText("Single document"));
    await userEvent.type(screen.getByLabelText("Document UUID"), VALID_UUID);

    await userEvent.click(screen.getByRole("button", { name: /Reset/ }));

    expect(
      getRequestCard().getByText("POST /api/collection-api/index-refresh")
    ).toBeInTheDocument();
    expect(getRequestCard().getByText("material-sample")).toBeInTheDocument();
    expect(screen.getByLabelText("All documents of this type")).toBeChecked();
    expect(screen.queryByLabelText("Document UUID")).not.toBeInTheDocument();
  });
});
