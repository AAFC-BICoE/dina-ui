import { mountWithAppContext } from "../../test-util/mock-app-context";
import { useBulkEditorFrontEndValidation } from "../useBulkEditorFrontEndValidation";
import { last } from "lodash";

describe("useBulkEditorFrontEndValidation hook", () => {
  const hookReturnValue = jest.fn();

  /** TestComponent just calls the hook. */
  function TestComponent() {
    hookReturnValue(useBulkEditorFrontEndValidation());
    return null;
  }

  beforeEach(() => {
    hookReturnValue.mockClear();
  });

  it("Initially returns with no validation errors.", () => {
    mountWithAppContext(<TestComponent />);
    const initialHookReturn = last(hookReturnValue.mock.calls)[0];
    expect(initialHookReturn).toEqual(
      expect.objectContaining({
        hasValidationErrors: false,
        validationAlertJsx: null
      })
    );
  });

  it("Adds and removes validation errors reported by Handsontable.", () => {
    mountWithAppContext(<TestComponent />);
    const initialHookReturn = last(hookReturnValue.mock.calls)[0];

    // Set the first bad value:
    initialHookReturn.afterValidate(
      false,
      "test-bad-value",
      5,
      "test-property"
    );

    const oneBadValueHookReturn = last(hookReturnValue.mock.calls)[0];
    expect(oneBadValueHookReturn.hasValidationErrors).toEqual(true);

    const oneErrorAlertWrapper = mountWithAppContext(
      oneBadValueHookReturn.validationAlertJsx
    );
    expect(oneErrorAlertWrapper.text()).toEqual(
      "Invalid value on row 6: test-bad-value"
    );

    // Set the second bad value:
    oneBadValueHookReturn.afterValidate(
      false,
      "test-bad-value-2",
      10,
      "test-property"
    );

    const twoBadValuesHookReturn = last(hookReturnValue.mock.calls)[0];
    const twoErrorsAlertWrapper = mountWithAppContext(
      twoBadValuesHookReturn.validationAlertJsx
    );
    expect(twoErrorsAlertWrapper.text()).toEqual(
      "Invalid value on row 6: test-bad-valueInvalid value on row 11: test-bad-value-2"
    );

    // Fix the first validation error:
    twoBadValuesHookReturn.afterValidate(
      true,
      "test-good-value",
      5,
      "test-property"
    );
    const oneFixedValueHookReturn = last(hookReturnValue.mock.calls)[0];
    const oneFixedValueAlertWrapper = mountWithAppContext(
      oneFixedValueHookReturn.validationAlertJsx
    );
    expect(oneFixedValueAlertWrapper.text()).toEqual(
      "Invalid value on row 11: test-bad-value-2"
    );
  });
});
