import { render, screen, fireEvent } from "@testing-library/react";
import { getIntlSupport } from "../..";
import "@testing-library/jest-dom";

const TEST_MESSAGES_EN = {
  testId: "test message"
};

const TEST_MESSAGES_FR = {
  testId: "message dans test"
};

const { FormattedMessage, IntlProvider, useIntl } = getIntlSupport({
  defaultMessages: TEST_MESSAGES_EN,
  translations: { en: TEST_MESSAGES_EN, fr: TEST_MESSAGES_FR }
});

function MessageDisplayer() {
  const { formatMessage } = useIntl();

  return <>{formatMessage("testId")}</>;
}

describe("IntlSupport", () => {
  it("Provides a 'useIntl' hook to get messages.", () => {
    render(
      <IntlProvider>
        <MessageDisplayer />
      </IntlProvider>
    );

    expect(screen.getByText("test message")).toBeInTheDocument();
  });

  it("Provides a 'FormattedMessage' component to render messages.", () => {
    render(
      <IntlProvider>
        <FormattedMessage id="testId" />
      </IntlProvider>
    );

    expect(screen.getByText("test message")).toBeInTheDocument();
  });

  it("Provides a 'useIntl' hook to change the locale.", () => {
    function LocaleSelector() {
      const { locale, setLocale } = useIntl();

      return (
        <div>
          <div>{`Current locale: ${locale}`}</div>
          <div>
            <button onClick={() => setLocale("fr")}>Change To French</button>
          </div>
          <FormattedMessage id="testId" />
        </div>
      );
    }

    render(
      <IntlProvider>
        <LocaleSelector />
      </IntlProvider>
    );

    expect(screen.getByText("Current locale: en")).toBeInTheDocument();
    expect(screen.getByText("test message")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Change To French"));

    expect(screen.getByText("Current locale: fr")).toBeInTheDocument();
    expect(screen.getByText("message dans test")).toBeInTheDocument();
  });
});
