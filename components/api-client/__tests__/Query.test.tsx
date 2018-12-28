import { KitsuResource, KitsuResponse } from "kitsu";
import { create } from "react-test-renderer";
import { Query } from "../Query";

const MOCK_REGIONS_RESPONSE: KitsuResponse<KitsuResource> = {
  data: [
    { id: "1", type: "region" },
    { id: "2", type: "region" },
    { id: "3", type: "region" }
  ]
};

// Mock Kitsu
jest.mock(
  "kitsu",
  () =>
    class {
      get = jest.fn(async () => MOCK_REGIONS_RESPONSE);
    }
);

describe("Query component", () => {
  it("Renders with loading as true before sending a request", done => {
    let renderCount = 0;
    create(
      <Query path="region">
        {({ loading }) => {
          // Query should be rendered once with loading as true.
          if (renderCount == 0) {
            expect(loading).toEqual(true);
            done();
          }
          renderCount++;
          return <div />;
        }}
      </Query>
    );
  });

  it("Passes data from the mocked API to chil components", done => {
    create(
      <Query path="region">
        {({ loading, response }) => {
          if (response) {
            expect(loading).toEqual(false);
            expect(response).toEqual(MOCK_REGIONS_RESPONSE);
            done();
            return <div />;
          }
          return <div />;
        }}
      </Query>
    );
  });
});
