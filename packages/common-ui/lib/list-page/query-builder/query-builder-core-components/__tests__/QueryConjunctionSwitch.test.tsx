import { mountWithAppContext2 } from "common-ui/lib/test-util/mock-app-context";
import { useState } from "react";
import { QueryConjunctionSwitch } from "../QueryConjunctionSwitch";
import { screen } from "@testing-library/react";

describe("QueryConjunctionSwitch component", () => {
  test("Snapshot Test", async () => {
    const andToggled = mountWithAppContext2(
      <>
        <QueryConjunctionSwitch currentConjunction="AND" />
      </>
    );
    expect(andToggled.asFragment()).toMatchSnapshot();

    const orToggled = mountWithAppContext2(
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

    const toggle = mountWithAppContext2(
      <>
        <TestToggle />
      </>
    );

    const buttons = toggle.getAllByRole("button");
    const andButton = buttons[0];
    const orButton = buttons[1];

    // Expect the initial state.
    expect(
      toggle.find(QueryConjunctionSwitch).prop("currentConjunction")
    ).toEqual("AND");

    // Click the toggle to "OR".
    toggle.find("button").at(1).simulate("click");
    expect(
      toggle.find(QueryConjunctionSwitch).prop("currentConjunction")
    ).toEqual("OR");

    // Switch back to "AND"
    toggle.find("button").at(0).simulate("click");
    expect(
      toggle.find(QueryConjunctionSwitch).prop("currentConjunction")
    ).toEqual("AND");
  });
});
