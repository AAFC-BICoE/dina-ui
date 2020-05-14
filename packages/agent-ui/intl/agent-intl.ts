import { getIntlSupport } from "common-ui";
import { AGENT_MESSAGES_ENGLISH } from "./agent-en";
import { AGENT_MESSAGES_FRENCH } from "./agent-fr";

const { FormattedMessage, IntlProvider, useIntl } = getIntlSupport({
  defaultMessages: AGENT_MESSAGES_ENGLISH,
  translations: {
    en: AGENT_MESSAGES_ENGLISH,
    fr: AGENT_MESSAGES_FRENCH
  }
});

export const AgentMessage = FormattedMessage;
export const AgentIntlProvider = IntlProvider;
export const useAgentIntl = useIntl;
