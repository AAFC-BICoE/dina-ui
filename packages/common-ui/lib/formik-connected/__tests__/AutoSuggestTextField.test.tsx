import { KitsuResource } from "kitsu";
import lodash from "lodash";
import AutoSuggest from "react-autosuggest";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { AutoSuggestTextField } from "../AutoSuggestTextField";
import { DinaForm } from "../DinaForm";

// Mock out the debounce function to avoid waiting during tests.
jest.spyOn(lodash, "debounce").mockImplementation((fn: any) => fn);

interface Person extends KitsuResource {
  name: string;
}

const mockGet = jest.fn(async () => ({
  data: [{ name: "person1" }, { name: "person2" }, { name: "person3" }]
}));

const apiContext = {
  apiClient: {
    get: mockGet
  }
} as any;

describe("AutoSuggestTextField", () => {
  it("Fetches the suggestions from the back-end.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <AutoSuggestTextField<Person>
          name="examplePersonNameField"
          query={searchValue => ({
            path: "agent-api/person",
            filter: {
              rsql: `name==*${searchValue}*`
            }
          })}
          suggestion={person => person.name}
        />
      </DinaForm>,
      { apiContext }
    );

    wrapper.find("input").simulate("change", { target: { value: "p" } });

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
      "person1",
      "person2",
      "person3"
    ]);
    expect(mockGet).lastCalledWith("agent-api/person", {
      filter: { rsql: "name==*p*" }
    });
  });
});
