import { JsonApiErrorResponse, KitsuResource, KitsuResponse } from "kitsu";
import { create } from "react-test-renderer";
import { Query } from "../Query";

const MOCK_REGIONS_RESPONSE: KitsuResponse<KitsuResource> = {
  data: [
    { id: "1", type: "region" },
    { id: "2", type: "region" },
    { id: "3", type: "region" }
  ]
};

const MOCK_500_ERROR: JsonApiErrorResponse = {
  errors: [
    {
      status: "500",
      title: "INTERNAL_SERVER_ERROR",
      detail:
        "Unable to locate Attribute [unknownAttribute] on this ManagedType [ca.gc.aafc.seqdb.entities.Tag]"
    }
  ]
};

// Mock Kitsu
jest.mock(
  "kitsu",
  () =>
    class {
      async get(path, { fields }) {
        if (path == "region") {
          if (fields && fields.region == "unknownAttribute") {
            throw MOCK_500_ERROR;
          }
          return MOCK_REGIONS_RESPONSE;
        }
      }
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

  it("Passes data from the mocked API to child components", done => {
    // Spy on Kitsu class' "get" method.
    const kitsuGet = jest.spyOn(require("kitsu").prototype, "get");

    create(
      <Query path="region">
        {({ loading, response }) => {
          if (response) {
            expect(loading).toEqual(false);
            expect(response).toEqual(MOCK_REGIONS_RESPONSE);
            done();
          }
          return <div />;
        }}
      </Query>
    );

    expect(kitsuGet).toHaveBeenCalledTimes(1);
    
    // Get the params of the last call to Kitsu's GET method.
    const [path, getParams] = kitsuGet.mock.calls.pop();
    expect(path).toEqual("region");
    
    // The Query's GET params should not have any values explicitly set to undefined.
    // This would create an invalid request URL, e.g. /api/region?fields=undefined
    expect(Object.values(getParams).includes(undefined)).toBeFalsy();
  });
  
  it("Requests sparse fields", () => {
    // Spy on Kitsu class' "get" method.
    const kitsuGet = jest.spyOn(require("kitsu").prototype, "get");
    
    create(
      <Query path="region" fields={{ region: "name,symbol" }}>
        {() => <div />}
      </Query>
    );
    
    expect(kitsuGet).toHaveBeenCalledTimes(1);
    // Get the params of the last call to Kitsu's GET method.
    const [path, getParams] = kitsuGet.mock.calls.pop();
    expect(path).toEqual("region");
    expect(getParams).toEqual({ fields: { region: "name,symbol" } });
  });

  it("Renders an error to child components", done => {
    // Get an error by requesting an attribute that the resource doesn't have.
    create(
      <Query path="region" fields={{ region: "unknownAttribute" }}>
        {({ loading, error, response }) => {
          if (!loading) {
            expect(error).toEqual(MOCK_500_ERROR);
            expect(response).toBeUndefined();
            done();
          }
          return <div />;
        }}
      </Query>
    );
  });
});
