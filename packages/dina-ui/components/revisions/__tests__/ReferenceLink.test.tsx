import { mountWithAppContext } from "common-ui";
import { Person } from "../../../types/objectstore-api";
import { ReferenceLink } from "../ReferenceLink";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";

const mockGet = jest.fn(async () => ({
  data: {
    id: "64047517-b7d4-4af9-af86-4bef3ff36950",
    type: "person",
    displayName: "Mat Poff"
  }
}));

describe("ReferenceLink component", () => {
  it("Renders the link to a resource.", async () => {
    const wrapper = mountWithAppContext(
      <ReferenceLink<Person>
        baseApiPath="agent-api"
        type="person"
        reference={{
          cdoId: "64047517-b7d4-4af9-af86-4bef3ff36950",
          typeName: "person"
        }}
        name={(person) => (
          <span className="display-name">{person.displayName}</span>
        )}
        href="/person/view?id="
      />,
      { apiContext: { apiClient: { get: mockGet } as any } }
    );

    // Shows the custom ".display-name" span and the link:
    await waitFor(() => {
      expect(wrapper.getByText(/mat poff/i)).toBeInTheDocument();
      expect(wrapper.getByRole("link")).toHaveAttribute(
        "href",
        "/person/view?id=64047517-b7d4-4af9-af86-4bef3ff36950"
      );
    });
  });
});
