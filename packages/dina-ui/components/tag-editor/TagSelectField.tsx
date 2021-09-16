import {
  FieldWrapper,
  FieldWrapperProps,
  filterBy,
  useAccount,
  useQuery
} from "common-ui";
import { KitsuResource } from "kitsu";
import { compact, last, uniq } from "lodash";
import { useMemo, useState } from "react";
import { AiFillTag } from "react-icons/ai";
import CreatableSelect from "react-select/creatable";
import { useDinaIntl } from "../../intl/dina-ui-intl";

export interface TagSelectFieldProps extends FieldWrapperProps {
  /** The API path to search for previous tags. */
  resourcePath?: string;
}

export interface TagSelectOption {
  label: string;
  value: string;
}

interface KitsuResourceWithTags extends KitsuResource {
  tags?: string[];
}

/** Tag Select/Create field hooked into Formik. */
export function TagSelectField({
  resourcePath,
  ...props
}: TagSelectFieldProps) {
  return (
    <FieldWrapper
      {...props}
      readOnlyRender={tagsVal => (
        <div className="d-flex flex-wrap gap-2">
          {(tagsVal ?? []).map((tag, index) => (
            <div
              key={index}
              className="card p-1 flex-row align-items-center gap-1"
              style={{ background: "rgb(221, 221, 221)" }}
            >
              <AiFillTag />
              <span>{tag}</span>
            </div>
          ))}
        </div>
      )}
    >
      {({ value, setValue, invalid }) => (
        <TagSelect
          value={value}
          onChange={setValue}
          invalid={invalid}
          resourcePath={resourcePath}
        />
      )}
    </FieldWrapper>
  );
}

interface TagSelectProps {
  value?: string[];
  onChange: (newValue: string[]) => void;
  resourcePath?: string;
  invalid?: boolean;
}

/** Tag Select/Create field. */
function TagSelect({ value, onChange, resourcePath, invalid }: TagSelectProps) {
  const { formatMessage } = useDinaIntl();
  const { roles, groupNames } = useAccount();

  /** The value of the input element. */
  const [inputValue, setInputValue] = useState("");

  const typeName = last(resourcePath?.split("/"));

  const filter = filterBy(
    ["tags"],
    !roles.includes("dina-admin")
      ? {
          extraFilters: [
            // Restrict the list to just the user's groups:
            {
              selector: "group",
              comparison: "=in=",
              arguments: (groupNames || []).join(",")
            }
          ]
        }
      : undefined
  );

  const { loading, response } = useQuery<KitsuResourceWithTags[]>(
    {
      path: resourcePath ?? "",
      sort: "-createdOn",
      fields: typeName ? { [typeName]: "tags" } : undefined,
      filter: {
        tags: { NEQ: "null" },
        ...filter("")
      },
      page: { limit: 100 }
    },
    { disabled: !resourcePath }
  );

  const previousTagsOptions = useMemo(
    () =>
      uniq(compact((response?.data ?? []).flatMap(({ tags }) => tags)))
        .filter(tag => tag.includes(inputValue))
        .map(tag => ({ label: tag, value: tag })),
    [response]
  );

  function toOption(tagText: string): TagSelectOption {
    return { label: tagText, value: tagText };
  }

  const selectedOptions = (value ?? []).map(toOption);

  const customStyle: any = {
    multiValueLabel: base => ({ ...base, cursor: "move" }),
    placeholder: base => ({ ...base, color: "rgb(87,120,94)" }),
    control: base => ({
      ...base,
      ...(invalid && {
        borderColor: "rgb(148, 26, 37)",
        "&:hover": { borderColor: "rgb(148, 26, 37)" }
      })
    })
  };

  function setAsStringArray(selected: TagSelectOption[]) {
    onChange(selected.map(option => option.value));
  }

  return (
    <CreatableSelect<TagSelectOption, true>
      // Input value:
      inputValue={inputValue}
      onInputChange={newVal => setInputValue(newVal)}
      // Field value:
      value={selectedOptions}
      onChange={setAsStringArray}
      // Select options:
      options={[
        {
          label: formatMessage("typeNewTagOrSearchPreviousTags"),
          options: previousTagsOptions
        }
      ]}
      // Select config:
      styles={customStyle}
      isMulti={true}
      isLoading={loading}
      allowCreateWhileLoading={true}
      isClearable={true}
      placeholder={formatMessage("typeNewTagOrSearchPreviousTags")}
      noOptionsMessage={() => formatMessage("typeNewTagOrSearchPreviousTags")}
      formatCreateLabel={input => `${formatMessage("add")} "${input}"`}
    />
  );
}
