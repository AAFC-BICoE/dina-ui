import { KitsuResource } from "kitsu";
import AutoSuggest from "react-autosuggest";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { AutoSuggestTextField } from "../AutoSuggestTextField";
import { DinaForm } from "../DinaForm";

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
          jsonApiBackend={{
            query: searchValue => ({
              path: "agent-api/person",
              filter: {
                rsql: `name==*${searchValue}*`
              }
            }),
            option: person => person?.name
          }}
          timeoutMs={0}
        />
      </DinaForm>,
      { apiContext }
    );

    wrapper.find("input").simulate("change", { target: { value: "p" } });
    wrapper.find("input").simulate("focus");

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
      "person1",
      "person2",
      "person3"
    ]);
    expect(mockGet).lastCalledWith("agent-api/person", {
      filter: { rsql: "name==*p*" },
      sort: "-createdOn"
    });
  });

  it("Can render custom suggestions passed via props.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <AutoSuggestTextField<Person>
          name="examplePersonNameField"
          customOptions={() => ["suggestion-1", "suggestion-2"]}
          timeoutMs={0}
        />
      </DinaForm>,
      { apiContext }
    );

    expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
      "suggestion-1",
      "suggestion-2"
    ]);
  });
});
