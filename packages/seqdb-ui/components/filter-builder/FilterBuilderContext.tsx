import { createContext, useMemo } from "react";
import titleCase from "title-case";
import { useSeqdbIntl } from "../../intl/seqdb-intl";
import { FilterAttribute } from "./FilterBuilder";
import { FilterAttributeOption } from "./FilterRow";

export interface FilterBuilderContextI {
  attributeOptions: FilterAttributeOption[];
}

export interface FilterBuilderContextProviderProps {
  children: React.ReactNode;
  filterAttributes: FilterAttribute[];
}

export const FilterBuilderContext = createContext<FilterBuilderContextI | null>(
  null
);

/**
 * Component providing FilterBuilder values to child components through React context.
 */
export function FilterBuilderContextProvider({
  children,
  filterAttributes
}: FilterBuilderContextProviderProps) {
  const { formatMessage, messages } = useSeqdbIntl();

  const attributeOptions = useMemo(
    () =>
      filterAttributes.map<FilterAttributeOption>(attr => {
        const { fieldName, customLabel } =
          typeof attr === "string"
            ? {
                customLabel: undefined,
                fieldName: attr
              }
            : {
                customLabel: attr.label,
                fieldName: attr.name
              };

        const messageKey = `field_${fieldName}`;

        const optionLabel =
          customLabel ??
          (messages[messageKey]
            ? formatMessage(messageKey as any)
            : titleCase(fieldName));

        return { label: optionLabel, value: attr };
      }),
    [filterAttributes]
  );

  return (
    <FilterBuilderContext.Provider value={{ attributeOptions }}>
      {children}
    </FilterBuilderContext.Provider>
  );
}
