import { mountWithAppContext } from "common-ui/lib/test-util/mock-app-context";
import { useState } from "react";
import { QueryConjunctionSwitch } from "../QueryConjunctionSwitch";

describe("QueryConjunctionSwitch component", () => {
  test("Snapshot Test", async () => {
    const andToggled = mountWithAppContext(
      <>
        <QueryConjunctionSwitch currentConjunction="AND" />
      </>
    );
    expect(andToggled.find(QueryConjunctionSwitch).debug()).toMatchSnapshot();

    const orToggled = mountWithAppContext(
      <>
        <QueryConjunctionSwitch currentConjunction="OR" />
      </>
    );
    expect(orToggled.find(QueryConjunctionSwitch).debug()).toMatchSnapshot();
  });

  test("Toggle between the options", async () => {
    function TestToggle() {
      const [conjunction, setConjunction] = useState<string>("AND");

      return (
        <QueryConjunctionSwitch
          currentConjunction={conjunction}
          setConjunction={(newConjunction) => setConjunction(newConjunction)}
        />
      );
    }

    const toggle = mountWithAppContext(
      <>
        <TestToggle />
      </>
    );

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
