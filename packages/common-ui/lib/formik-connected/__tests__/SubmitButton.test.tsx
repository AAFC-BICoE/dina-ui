import { fireEvent } from "@testing-library/react";
import { mountWithAppContext2 } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { SubmitButton } from "../SubmitButton";
import "@testing-library/jest-dom";

describe("SubmitButton component", () => {
  it("Shows a submit button when the form is not submitting.", () => {
    const wrapper = mountWithAppContext2(
      /* tslint:disable:no-empty */
      <DinaForm initialValues={{}}>
        <SubmitButton />
      </DinaForm>
    );

    expect(wrapper.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
    expect(
      wrapper.queryByRole("button", { name: /save/i })
    ).toBeInTheDocument();
  });

  it("Shows a loading spinner when the form is submitting.", () => {
    const wrapper = mountWithAppContext2(
      /* tslint:disable:no-empty */
      <DinaForm initialValues={{}}>
        <SubmitButton />
      </DinaForm>
    );

    fireEvent.click(wrapper.getByRole("button", { name: /save/i }));

    expect(wrapper.queryByText(/loading\.\.\./i)).toBeInTheDocument();
    expect(
      wrapper.queryByRole("button", { name: /save/i })
    ).not.toBeInTheDocument();
  });
});
