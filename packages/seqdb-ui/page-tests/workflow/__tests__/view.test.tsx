import { Tab } from "react-tabs";
import { Head } from "../../../components";
import WorkflowViewPage from "../../../pages/workflow/view";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Chain, ChainStepTemplate } from "../../../types/seqdb-api";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

const mockUseRouter = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => mockUseRouter()
}));

const mockGet = jest.fn();

// Mock Kitsu, the client class that talks to the backend.
const mockCtx = {
  apiClient: {
    get: mockGet
  }
};

function getWrapper() {
  return mountWithAppContext(<WorkflowViewPage />, {
    apiContext: mockCtx as any
  });
}

describe("Workflow view page", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockUseRouter.mockImplementation(() => ({
      query: { id: "123" }
    }));

    mockGet.mockImplementation(async path => {
      if (path === "chain/123") {
        return {
          data: {
            chainTemplate: {
              id: "1000",
              name: "test workflow template",
              type: "chainTemplate"
            },
            dateCreated: "2019-11-20",
            id: "123",
            name: "test workflow",
            type: "chain"
          } as Chain
        };
      }
      if (path === "chainStepTemplate") {
        return {
          data: [
            {
              id: "1",
              stepNumber: 1,
              stepTemplate: {
                id: "1",
                name: "step number 1",
                outputs: ["TEST_OUTPUT"],
                type: "stepTemplate"
              },
              type: "chainStepTemplate"
            },
            {
              id: "2",
              stepNumber: 2,
              stepTemplate: {
                id: "2",
                name: "step number 2",
                outputs: ["TEST_OUTPUT"],
                type: "stepTemplate"
              },
              type: "chainStepTemplate"
            },
            {
              id: "3",
              stepNumber: 3,
              stepTemplate: {
                id: "3",
                name: "step number 3",
                outputs: ["TEST_OUTPUT"],
                type: "stepTemplate"
              },
              type: "chainStepTemplate"
            }
          ] as ChainStepTemplate[]
        };
      }
      return { data: [] };
    });
  });

  it("Renders the workflow view page.", async () => {
    const wrapper = getWrapper();

    // Await 2 initial queries.
    await new Promise(setImmediate);
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(Head).prop("title")).toEqual(
      "NGS Workflow: test workflow"
    );

    expect(wrapper.find("h1").at(0).text()).toEqual(
      "NGS Workflow: test workflow"
    );

    // Renders the step tabs:
    expect(wrapper.contains("Step 1: step number 1")).toEqual(true);
    expect(wrapper.contains("Step 2: step number 2")).toEqual(true);
    expect(wrapper.contains("Step 3: step number 3")).toEqual(true);
  });

  it("Lets you change tabs by clicking on the header.", async () => {
    const mockPush = jest.fn();

    // Start at step 2:
    mockUseRouter.mockImplementation(() => ({
      pathname: "/workflow/view",
      push: mockPush,
      query: { id: "123", step: "2" }
    }));

    const wrapper = getWrapper();

    // Await 2 initial queries.
    await new Promise(setImmediate);
    await new Promise(setImmediate);
    wrapper.update();

    // It should be on tab #2 at first because step 2 was passed in through the router/url:
    expect(
      wrapper
        .find(Tab)
        .findWhere(node => node.prop("selected") === true)
        .text()
    ).toEqual("Step 2: step number 2");

    // Switch to the #3 tab by clicking on the header:
    wrapper
      .find("li.react-tabs__tab")
      .findWhere(node => node.text() === "Step 3: step number 3")
      .at(0)
      .simulate("click");
    wrapper.update();

    // Tab #3 should be selected
    expect(mockPush.mock.calls).toEqual([
      [
        {
          pathname: "/workflow/view",
          query: {
            id: "123",
            step: 3
          }
        }
      ]
    ]);
  });

  it("Lets you change tabs by clicking the 'next step' button.", async () => {
    const mockPush = jest.fn();

    // Start at step 2:
    mockUseRouter.mockImplementation(() => ({
      pathname: "/workflow/view",
      push: mockPush,
      query: { id: "123", step: "2" }
    }));

    const wrapper = getWrapper();

    // Await 2 initial queries.
    await new Promise(setImmediate);
    await new Promise(setImmediate);
    wrapper.update();

    // It should be on tab #2 at first because step 2 was passed in through the router/url:
    expect(
      wrapper
        .find(Tab)
        .findWhere(node => node.prop("selected") === true)
        .text()
    ).toEqual("Step 2: step number 2");

    wrapper.find("button[children='Next Step']").simulate("click");
    wrapper.update();

    // Tab #3 should be selected
    expect(mockPush.mock.calls).toEqual([
      [
        {
          pathname: "/workflow/view",
          query: {
            id: "123",
            step: 3
          }
        }
      ]
    ]);
  });
});
