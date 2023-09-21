import { KitsuResource } from "kitsu";
import lodash from "lodash";
import { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import {
  getUserFriendlyAutoCompleteRenderer,
  makeDropdownOptionsUserFriendly,
  useResourceSelectCells
} from "../resource-select-cell";

interface Todo extends KitsuResource {
  name: string;
}

const mockGet = jest.fn();

// Called by the option loader function.
const mockProcess = jest.fn();

const mockApiContext = { apiClient: { get: mockGet } };

// Mock out the debounce function to avoid waiting during tests.
jest.spyOn(lodash, "debounce").mockImplementation((fn: any) => fn);

describe("resource-select-cell", () => {
  it("Provides a select cell that queries the back-end.", async () => {
    mockGet.mockImplementationOnce(async () => ({
      data: [
        { id: "1", type: "todo", name: "todo 1" },
        { id: "2", type: "todo", name: "todo 2" }
      ]
    }));

    function TestComponent() {
      const resourceSelectCell = useResourceSelectCells();

      const cell = resourceSelectCell<Todo>({
        filter: (input) => ({ rsql: `name==*${input}*` }),
        label: (todo) => todo.name,
        model: "todo"
      });

      useEffect(() => {
        (async () => {
          await (cell.source as any)("test input", mockProcess);
        })();
      });

      return <div />;
    }

    mountWithAppContext(<TestComponent />, {
      apiContext: mockApiContext
    });
    await new Promise(setImmediate);

    // GET should be called with the supplied filter input:
    expect(mockGet).lastCalledWith("todo", {
      filter: { rsql: "name==*test input*" },
      sort: "-createdOn"
    });

    // "process" should be called with the encoded response resources:
    expect(mockProcess).lastCalledWith(["todo 1 (todo/1)", "todo 2 (todo/2)"]);
  });

  it("Does not submit a filter when the cell already has an encoded resource in it.", (done) => {
    mockGet.mockImplementationOnce(async () => ({
      data: [
        { id: "1", type: "todo", name: "todo 1" },
        { id: "2", type: "todo", name: "todo 2" }
      ]
    }));

    function TestComponent() {
      const resourceSelectCell = useResourceSelectCells();

      const cell = resourceSelectCell<Todo>({
        filter: (input) => ({ rsql: `name==*${input}*` }),
        label: (todo) => todo.name,
        model: "todo"
      });

      useEffect(() => {
        (async () => {
          await (cell.source as any)(
            "Mat (todo/ee33d6ca-d232-4175-82bb-496ee7e0b028)",
            mockProcess
          );

          // GET should be called with the supplied filter input:
          expect(mockGet).lastCalledWith("todo", { sort: "-createdOn" });

          done();
        })();
      });

      return <div />;
    }

    mountWithAppContext(<TestComponent />, { apiContext: mockApiContext });
  });

  it("Provides a user-friendly autocomplete renderer to remove the {type}/{UUID} identifier.", () => {
    // The table cell to render into:
    const td = document.createElement("td");

    const mockOriginalAutocompleteRenderer = jest.fn((_, TD: HTMLElement) => {
      // The original handsontable renderer should render a string like this:
      TD.innerHTML = `<div class="htAutocompleteArrow">▼</div>Mat Poff (agent/0c900d69-c04c-491f-850a-fa72c089ff6d)`;
    });

    const userFriendlyAutoCompleteRenderer =
      getUserFriendlyAutoCompleteRenderer(mockOriginalAutocompleteRenderer);

    // Apply the custom renderer:
    userFriendlyAutoCompleteRenderer(null, td);

    expect(td.innerHTML).toEqual(
      `<div class="htAutocompleteArrow">▼</div>Mat Poff`
    );
  });

  it("Provides a user-friendly autocomplete dropdown renderer to remove the {type}/{UUID} identifier.", () => {
    const parentNode = document.createElement("div");

    // The original handsontable renderer should render a cell like this:
    parentNode.innerHTML = renderToStaticMarkup(
      <div>
        <table className="htCore">
          <tr>
            <td className="listbox">
              <strong />
              Mat Poff (agent/69f5d6e2-5294-11ea-8d77-2e728ce88125)
            </td>
          </tr>
        </table>
      </div>
    );

    makeDropdownOptionsUserFriendly(parentNode);

    // The {type}/{UUID} identifier should be gone:
    expect(
      parentNode.querySelector("table.htCore .listbox")?.innerHTML
    ).toEqual(`<strong></strong>Mat Poff`);
  });
});
