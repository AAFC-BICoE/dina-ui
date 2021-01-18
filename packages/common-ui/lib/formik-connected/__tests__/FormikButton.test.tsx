import { FormikButton, LoadingSpinner } from "../..";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";

const mockOnClick = jest.fn();
const mockOnSubmit = jest.fn();

function getWrapper() {
  return mountWithAppContext(
    <DinaForm
      initialValues={{ testProperty: "testValue" }}
      onSubmit={async ({ submittedValues }) => mockOnSubmit(submittedValues)}
    >
      <FormikButton onClick={mockOnClick}>Test Button</FormikButton>
    </DinaForm>
  );
}

describe("FormikButton component", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Renders the button.", () => {
    const wrapper = getWrapper();
    expect(wrapper.find("button[children='Test Button']").exists()).toEqual(
      true
    );
  });

  it("Renders a loading spinner while the form is loading.", async () => {
    const wrapper = getWrapper();

    mockOnSubmit.mockImplementation(async () => {
      await new Promise(setImmediate);
    });
    wrapper.find("form").simulate("submit");
    wrapper.update();

    expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
  });

  it("Provides an onClick method that provides access to the formik context.", () => {
    const wrapper = getWrapper();
    wrapper.find("button").simulate("click");
    expect(mockOnClick.mock.calls).toEqual([
      [
        { testProperty: "testValue" },
        expect.objectContaining({ setSubmitting: expect.anything() })
      ]
    ]);
  });
});
