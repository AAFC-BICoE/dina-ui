import { mountWithAppContext } from "common-ui/lib/test-util/mock-app-context";
import { useState } from "react";
import { QueryConjunctionSwitch } from "../QueryConjunctionSwitch";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("QueryConjunctionSwitch component", () => {
  test("Snapshot Test", async () => {
    const andToggled = mountWithAppContext(
      <>
        <QueryConjunctionSwitch currentConjunction="AND" />
      </>
    );
    expect(andToggled.asFragment()).toMatchSnapshot();

    const orToggled = mountWithAppContext(
      <>
        <QueryConjunctionSwitch currentConjunction="OR" />
      </>
    );
    expect(orToggled.asFragment()).toMatchSnapshot();
  });

  test("Toggle between the options", async () => {
    const conjunctionChangedMock = jest.fn();

    function TestToggle() {
      const [conjunction, setConjunction] = useState<string>("AND");

      return (
        <QueryConjunctionSwitch
          currentConjunction={conjunction}
          setConjunction={(newConjunction) => {
            setConjunction(newConjunction);
            conjunctionChangedMock(newConjunction);
          }}
        />
      );
    }

    const toggle = mountWithAppContext(
      <>
        <TestToggle />
      </>
    );

    const buttons = toggle.getAllByRole("button");
    const andButton = buttons[0];
    const orButton = buttons[1];

    // Expect the initial state.
    expect(andButton).toHaveClass("activeToggle");
    expect(orButton).not.toHaveClass("activeToggle");

    // Click the toggle to "OR".
    fireEvent.click(orButton);

    // OR should now be switched.
    expect(andButton).not.toHaveClass("activeToggle");
    expect(orButton).toHaveClass("activeToggle");

    // Switch back to "AND"
    fireEvent.click(andButton);

    // AND should now be switched again.
    expect(andButton).toHaveClass("activeToggle");
    expect(orButton).not.toHaveClass("activeToggle");
  });
});
