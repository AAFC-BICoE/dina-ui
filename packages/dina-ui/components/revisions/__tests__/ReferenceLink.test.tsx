import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Person } from "../../../types/objectstore-api";
import { ReferenceLink } from "../ReferenceLink";

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
        instanceId={{
          cdoId: "64047517-b7d4-4af9-af86-4bef3ff36950",
          typeName: "person"
        }}
        link={({ displayName }) => (
          <span className="display-name">{displayName}</span>
        )}
      />,
      { apiContext: { apiClient: { get: mockGet } as any } }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Shows the custom ".display-name" span:
    expect(wrapper.find(".display-name").text()).toEqual("Mat Poff");
  });
});
