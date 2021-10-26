import { get } from "lodash";
import {
  MultilingualDescription,
  MultilingualPair
} from "../../../dina-ui/types/collection-api/resources/PreparationType";
import { useContext } from "react";
import { intlContext } from "../intl/IntlSupport";

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

      const descriptionPairs: MultilingualPair[] =
        multilingualDescription.descriptions;

      // Loop through all of the descriptions provided, the preferred one is always the currently used language.
      for (const description of descriptionPairs) {
        if (description.lang === language) {
          return <div>description.desc</div>;
        }
      }

      // Preferred language could not be found above. Use another language and make sure it's indicated.
      return <div>{descriptionPairs[0] ? descriptionPairs[0].desc : ""}</div>;
    },
    accessor
  };
}
