import QueryBuilderScientificNameDetailsSearch from "../QueryBuilderScientificNameDetailsSearch";
import { mountWithAppContext } from "common-ui/lib/test-util/mock-app-context";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { QueryBuilderContextProvider } from "../../QueryBuilder";
import { noop } from "lodash";
import userEvent from "@testing-library/user-event";
import { Vocabulary } from "packages/dina-ui/types/collection-api";

export const TEST_CLASSIFICATIONS: Vocabulary = {
  id: "taxonomicRank",
  type: "vocabulary",
  vocabularyElements: [
    {
      key: "kingdom",
      name: "kingdom",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "kingdom"
          },
          {
            lang: "fr",
            title: "règne"
          }
        ]
      }
    }
  ]
};

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/vocabulary2/taxonomicRank":
      return { data: TEST_CLASSIFICATIONS };
  }
});

const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("QueryBuilderScientificNameDetailsSearch", () => {
  describe("QueryBuilderScientificNameDetailsSearch Component", () => {
    it("Display field if match type is equals", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const textSearchEquals = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderScientificNameDetailsSearch
              value='{"searchValue":"","selectedOperator":"exactMatch","selectedClassificationRank":"class"}'
              setValue={jest.fn}
              isInColumnSelector={false}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        {
          apiContext
        }
      );

      // Expect a snapshot with the text field being displayed.
      expect(textSearchEquals.asFragment()).toMatchSnapshot(
        "Expect text field to be displayed since match type is equals"
      );

      const textSearchEmpty = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderScientificNameDetailsSearch
              value='{"searchValue":"","selectedOperator":"empty","selectedClassificationRank":"class"}'
              setValue={jest.fn}
              isInColumnSelector={false}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        {
          apiContext
        }
      );

      // Expect a snapshot without the text field being displayed.
      expect(textSearchEmpty.asFragment()).toMatchSnapshot(
        "Expect text field not to be displayed since the match type is not equals"
      );
    });

    it("Should call performSubmit on enter key press in textfield", async () => {
      const mockPerformSubmit = jest.fn();
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: mockPerformSubmit, groups: [] }}
          >
            <QueryBuilderScientificNameDetailsSearch
              value='{"searchValue":"","selectedOperator":"exactMatch","selectedClassificationRank":"class"}'
              setValue={jest.fn}
              isInColumnSelector={false}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        {
          apiContext
        }
      );

      // Find the text field element
      const textField = wrapper.getByRole("textbox");

      // Expect performSubmit to not be called yet.
      expect(mockPerformSubmit).toHaveBeenCalledTimes(0);

      // Simulate user typing "enter" key
      userEvent.type(textField, "{enter}");

      // Expect performSubmit to be called once
      expect(mockPerformSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
