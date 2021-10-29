import { get } from "lodash";
import {
  MultilingualDescription,
  MultilingualPair
} from "../../../dina-ui/types/collection-api/resources/PreparationType";
import { useContext } from "react";
import { intlContext } from "../intl/IntlSupport";
import { useIntl } from "react-intl";

/**
 * Points to the translation key, used for the language badge.
 */
export const LANGUAGE_BADGE_KEYS = {
  en: "languageDescriptionEnglish",
  fr: "languageDescriptionFrench"
};

/**
 * Used for multilingual descriptions which contain an English and French version of the
 * description.
 */
export function descriptionCell(accessor: string) {
  return {
    Cell: ({ original }) => {
      const { locale } = useContext(intlContext);

      // Retrieve the current language being used.
      const language = locale;

      // Get the descriptions provided.
      const multilingualDescription: MultilingualDescription = get(
        original,
        accessor
      );

      // If no descriptions are provided, just leave the cell blank.
      if (
        multilingualDescription.descriptions == null ||
        multilingualDescription.descriptions.length === 0
      ) {
        return <div />;
      }

      // Remove any blank descriptions.
      const descriptionPairs: MultilingualPair[] =
        multilingualDescription.descriptions.filter(
          description => description.desc !== ""
        );

      // Loop through all of the descriptions provided, the preferred one is always the currently used language.
      for (const description of descriptionPairs) {
        if (description.lang === language) {
          return (
            <div>
              <span className="description list-inline-item">
                {description.desc}
              </span>
              {languageBadge(description.lang)}
            </div>
          );
        }
      }

      // Preferred language could not be found above. Use another language and make sure it's indicated.
      // There is also the possibility that this is blank.
      return descriptionPairs.length !== 0 && descriptionPairs[0] !== null ? (
        <div>
          <span className="description list-inline-item">
            {descriptionPairs[0].desc}
          </span>
          {languageBadge(descriptionPairs[0].lang)}
        </div>
      ) : (
        <div />
      );
    },
    accessor
  };
}

/**
 * Generate the language badge using the MultilingualDescription language string.
 *
 * This badge will automatically get translated as well.
 *
 * @param language MultilingualDescription lang string.
 * @returns Language description badge element.
 */
function languageBadge(language) {
  const { formatMessage } = useIntl();

  return (
    <span className="badge">
      {formatMessage({ id: LANGUAGE_BADGE_KEYS[language] })}
    </span>
  );
}
