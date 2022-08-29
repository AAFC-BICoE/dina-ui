import { get } from "lodash";
import { useContext } from "react";
import { intlContext } from "../intl/IntlSupport";
import { useIntl } from "react-intl";
import {
  MultilingualDescription,
  MultilingualTitle
} from "packages/dina-ui/types/common/";

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
      const multilingualDescription: MultilingualDescription | null = get(
        original,
        accessor
      );

      // If no descriptions are provided, just leave the cell blank.
      if (
        multilingualDescription?.descriptions == null ||
        multilingualDescription?.descriptions.length === 0
      ) {
        return <div />;
      }

      // Remove any blank descriptions.
      const descriptionPairs = multilingualDescription?.descriptions.filter(
        (description) => description.desc !== ""
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
 * Shows the multilingual description in all languages.
 */
export function allLangsDescriptionCell(accessor: string) {
  return {
    Cell: ({ original: { value } }) =>
      value?.descriptions?.map(
        (desc, index) =>
          desc?.desc && (
            <div className="pb-2" key={index}>
              <strong>{desc?.lang}: </strong> {desc?.desc}
            </div>
          )
      ) ?? null,
    accessor
  };
}

/**
 * Used for multilingual titles which contain an English and French version of the
 * title.
 */
export function titleCell(accessor: string) {
  return {
    Cell: ({ original }) => {
      const { locale } = useContext(intlContext);

      // Retrieve the current language being used.
      const language = locale;

      // Get the titles provided.
      const multilingualTitle: MultilingualTitle | null = get(
        original,
        accessor
      );

      // If no titles are provided, just leave the cell blank.
      if (
        multilingualTitle?.titles == null ||
        multilingualTitle?.titles.length === 0
      ) {
        return <div />;
      }

      // Remove any blank titles.
      const titlePairs = multilingualTitle?.titles.filter(
        (titleItem) => titleItem.title !== ""
      );

      // Loop through all of the titles provided, the preferred one is always the currently used language.
      for (const titlePair of titlePairs) {
        if (titlePair.lang === language) {
          return (
            <div>
              <span className="title list-inline-item">{titlePair.title}</span>
              {languageBadge(titlePair.lang)}
            </div>
          );
        }
      }

      // Preferred language could not be found above. Use another language and make sure it's indicated.
      // There is also the possibility that this is blank.
      return titlePairs.length !== 0 && titlePairs[0] !== null ? (
        <div>
          <span className="title list-inline-item">{titlePairs[0].title}</span>
          {languageBadge(titlePairs[0].lang)}
        </div>
      ) : (
        <div />
      );
    },
    accessor
  };
}

/**
 * Shows the multilingual title in all languages.
 */
export function allLangsTitleCell(accessor: string) {
  return {
    Cell: ({ original: { value } }) =>
      value?.titles?.map(
        (title, index) =>
          title?.title && (
            <div className="pb-2" key={index}>
              <strong>{title?.lang}: </strong> {title?.title}
            </div>
          )
      ) ?? null,
    accessor
  };
}

/**
 * Generate the language badge using the MultilingualDescription or MultilingualTitle language
 * string.
 *
 * This badge will automatically get translated as well.
 *
 * @param language MultilingualDescription or MultilingualTitle lang string.
 * @returns Language description or title badge element.
 */
function languageBadge(language) {
  const { formatMessage } = useIntl();

  return (
    <span className="badge">
      {formatMessage({ id: LANGUAGE_BADGE_KEYS[language] })}
    </span>
  );
}
