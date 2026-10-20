import { DinaForm, mountWithAppContext } from "common-ui";
import { fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { OrganismStateField } from "../OrganismStateField";

const mockGet = jest.fn<any, any>(async (path) => {
  if (path === "collection-api/organism") {
    return {
      data: [
        { id: "1", type: "organism", lifeStage: "adult", sex: "female" },
        { id: "2", type: "organism", lifeStage: "larva", sex: "male" }
      ]
    };
  }
  return { data: [], meta: { totalResourceCount: 0 } };
});

const apiContext = {
  apiClient: { get: mockGet, axios: { get: jest.fn(), post: jest.fn() } },
  bulkGet: jest.fn<any, any>(async (paths: string[]) => paths.map(() => null))
} as any;

/** The params of every organism suggestion request, in order. */
function organismParams() {
  return mockGet.mock.calls
    .filter(([path]) => path === "collection-api/organism")
    .map(([, params]) => params);
}

/** Renders the organism fields of the first organism, as the material sample form does. */
function renderOrganismStateField(group?: string) {
  return mountWithAppContext(
    <DinaForm
      initialValues={{
        ...(group ? { group } : {}),
        organism: [{ type: "organism" }]
      }}
    >
      <OrganismStateField
        index={0}
        namePrefix="organism[0]."
        individualEntry={true}
        onTargetChecked={jest.fn()}
      />
    </DinaForm>,
    { apiContext }
  );
}

describe("OrganismStateField suggestions", () => {
  beforeEach(jest.clearAllMocks);

  it("Sends the Life Stage suggestion filter, with the form's group, as a simple filter.", async () => {
    const wrapper = renderOrganismStateField("aafc");
    const lifeStage = wrapper.getByRole("textbox", { name: /life stage/i });

    // Blank search on focus (blankSearchBackend="json-api"): only the group.
    fireEvent.focus(lifeStage);
    await waitFor(
      () =>
        expect(organismParams()).toContainEqual({
          filter: { group: { EQ: "aafc" } },
          sort: "-createdOn"
        }),
      { timeout: 3000 }
    );

    await userEvent.type(lifeStage, "adu");
    await waitFor(
      () =>
        expect(organismParams().at(-1)).toEqual({
          filter: { lifeStage: { ILIKE: "%adu%" }, group: { EQ: "aafc" } },
          sort: "-createdOn"
        }),
      { timeout: 3000 }
    );
    await waitFor(
      () => expect(wrapper.getByText("adult")).toBeInTheDocument(),
      { timeout: 3000 }
    );
  });

  it("Sends the Sex suggestion filter as a simple filter.", async () => {
    const wrapper = renderOrganismStateField("aafc");
    const sex = wrapper.getByRole("textbox", { name: /^sex$/i });

    fireEvent.focus(sex);
    await userEvent.type(sex, "fem");
    await waitFor(
      () =>
        expect(organismParams().at(-1)).toEqual({
          filter: { sex: { ILIKE: "%fem%" }, group: { EQ: "aafc" } },
          sort: "-createdOn"
        }),
      { timeout: 3000 }
    );
  });

  it("Sends no filter for a blank search without a group (FIQL sent fiql= here, which the back-end answers with 400).", async () => {
    const wrapper = renderOrganismStateField();
    const lifeStage = wrapper.getByRole("textbox", { name: /life stage/i });

    fireEvent.focus(lifeStage);
    await waitFor(
      () =>
        expect(organismParams()).toContainEqual({
          filter: {},
          sort: "-createdOn"
        }),
      { timeout: 3000 }
    );
    for (const params of organismParams()) {
      expect(params).not.toHaveProperty("fiql");
    }
  });
});
