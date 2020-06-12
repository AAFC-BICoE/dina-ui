import { mount } from "enzyme";
import { getIntlSupport } from "../..";

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
    const wrapper = mount(
      <IntlProvider>
        <MessageDisplayer />
      </IntlProvider>
    );

    expect(wrapper.contains("test message")).toEqual(true);
  });

  it("Provides a 'FormattedMessage' component to render messages.", () => {
    const wrapper = mount(
      <IntlProvider>
        <FormattedMessage id="testId" />
      </IntlProvider>
    );

    expect(wrapper.contains("test message")).toEqual(true);
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

    const wrapper = mount(
      <IntlProvider>
        <LocaleSelector />
      </IntlProvider>
    );

    expect(wrapper.contains("Current locale: en")).toEqual(true);
    expect(wrapper.contains("test message")).toEqual(true);

    wrapper.find("button[children='Change To French']").simulate("click");

    wrapper.update();

    expect(wrapper.contains("Current locale: fr")).toEqual(true);
    expect(wrapper.contains("message dans test")).toEqual(true);
  });
});
