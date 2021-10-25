import { get } from "lodash";
import {
  MultilingualDescription,
  MultilingualPair
} from "../../../dina-ui/types/collection-api/resources/PreparationType";

/**
 * Used for multilingual descriptions which contain an English and French version of the
 * description.
 */
export function descriptionCell(accessor: string) {
  return {
    Cell: ({ original }) => {
      // Retrieve the current language being used.
      const language = "fr"; // TODO: retrieve the current language.

      // Get the descriptions provided.
      const multilingualDescription: MultilingualDescription = get(
        original,
        accessor
      );
      const descriptionPairs: MultilingualPair[] | null | undefined =
        multilingualDescription.descriptions;

      // If no descriptions are provided, just leave the cell blank.
      if (descriptionPairs == null || descriptionPairs.length === 0) {
        return null;
      }

      // Multiple languages provided.
      if (descriptionPairs.length > 1) {
        // Loop through all of the descriptions provided.
        descriptionPairs.forEach((description: MultilingualPair) => {
          // If current language is detected, use that one.
          if (description.lang === language) {
            return description.desc;
          }
        });

        // If the current language could not be found, just use one of them.
        return descriptionPairs.at(0)?.desc;
      } else {
        const description = descriptionPairs.at(0);
        // Check if the only description is the currently used language.
        if (description?.lang === language) {
          // Display the description without indicating the language.
          return description.desc;
        } else {
          return description?.lang;
        }
      }
    },
    accessor
  };
}
