import { KitsuResource } from "kitsu";
import lodash from "lodash";
import { useEffect } from "react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { useResourceSelectCells } from "../resource-select-cell";

interface Todo extends KitsuResource {
  name: string;
}

const mockGet = jest.fn();

// Called by the option loader function.
const mockProcess = jest.fn();

const mockApiContext: any = { apiClient: { get: mockGet } };

// Mock out the debounce function to avoid waiting during tests.
jest.spyOn(lodash, "debounce").mockImplementation((fn: any) => fn);

describe("resource-select-cell", () => {
  it("Provides a select cell that queries the back-end.", async done => {
    mockGet.mockImplementationOnce(async () => ({
      data: [
        { id: "1", type: "todo", name: "todo 1" },
        { id: "2", type: "todo", name: "todo 2" }
      ]
    }));

    function TestComponent() {
      const resourceSelectCell = useResourceSelectCells();

      const cell = resourceSelectCell<Todo>({
        filter: input => ({ rsql: `name==*${input}*` }),
        label: todo => todo.name,
        model: "todo"
      });

      useEffect(() => {
        (async () => {
          await (cell.source as any)("test input", mockProcess);

          // GET should be called with the supplied filter input:
          expect(mockGet).lastCalledWith("todo", {
            filter: { rsql: "name==*test input*" }
          });

          // "process" should be called with the encoded response resources:
          expect(mockProcess).lastCalledWith([
            "todo 1 (todo/1)",
            "todo 2 (todo/2)"
          ]);
          done();
        })();
      });

      return <div />;
    }

    mountWithAppContext(<TestComponent />, { apiContext: mockApiContext });
  });

  it("Does not submit a filter when the cell already has an encoded resource in it.", async done => {
    mockGet.mockImplementationOnce(async () => ({
      data: [
        { id: "1", type: "todo", name: "todo 1" },
        { id: "2", type: "todo", name: "todo 2" }
      ]
    }));

    function TestComponent() {
      const resourceSelectCell = useResourceSelectCells();

      const cell = resourceSelectCell<Todo>({
        filter: input => ({ rsql: `name==*${input}*` }),
        label: todo => todo.name,
        model: "todo"
      });

      useEffect(() => {
        (async () => {
          await (cell.source as any)(
            "Mat (todo/ee33d6ca-d232-4175-82bb-496ee7e0b028)",
            mockProcess
          );

          // GET should be called with the supplied filter input:
          expect(mockGet).lastCalledWith("todo", {});

          done();
        })();
      });

      return <div />;
    }

    mountWithAppContext(<TestComponent />, { apiContext: mockApiContext });
  });
});
