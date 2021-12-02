import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { DeterminationField } from "../DeterminationField";

const mockOnSubmit = jest.fn();

describe("DeterminationField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Doesn't try to save what the user types into the name search box.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ determination: [{ isPrimary: true }] }}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <DeterminationField />
      </DinaForm>
    );

    // Input some text:
    wrapper
      .find(".col-search-input")
      .simulate("change", { target: { value: "test-name" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Empty determination submitted:
    expect(mockOnSubmit).lastCalledWith({
      determination: [{ isPrimary: true }]
    });
  });
});
