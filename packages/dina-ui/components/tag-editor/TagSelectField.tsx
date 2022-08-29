import {
  FieldWrapper,
  FieldWrapperProps,
  filterBy,
  useAccount,
  useQuery
} from "common-ui";
import { KitsuResource } from "kitsu";
import { compact, last, uniq, get } from "lodash";
import { useMemo, useState } from "react";
import { AiFillTag } from "react-icons/ai";
import { components as reactSelectComponents } from "react-select";
import CreatableSelect from "react-select/creatable";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import { useDinaIntl } from "../../intl/dina-ui-intl";

export interface TagSelectFieldProps extends FieldWrapperProps {
  /** The API path to search for previous tags. */
  resourcePath?: string;
  groupSelectorName?: string;
  /** The field name to use when finding other tags via RSQL filter. */
  tagsFieldName?: string;
}

export interface TagSelectOption {
  label: string;
  value: string;
}

/** Tag Select/Create field hooked into Formik. */
export function TagSelectField({
  resourcePath,
  tagsFieldName,
  ...props
}: TagSelectFieldProps) {
  return (
    <FieldWrapper
      {...props}
      readOnlyRender={(tagsVal) =>
        !!tagsVal?.length && (
          <div className="d-flex flex-wrap gap-2">
            {(tagsVal ?? []).map((tag, index) => (
              <div
                key={index}
                className="card py-1 px-2 flex-row align-items-center gap-1"
                style={{ background: "rgb(24, 102, 109)" }}
              >
                <AiFillTag className="text-white" />
                <span className="text-white">{tag}</span>
              </div>
            ))}
          </div>
        )
      }
    >
      {({ value, setValue, invalid, placeholder }) => (
        <TagSelect
          value={value}
          onChange={setValue}
          invalid={invalid}
          resourcePath={resourcePath}
          groupSelectorName={props.groupSelectorName}
          placeholder={placeholder}
          tagsFieldName={tagsFieldName}
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
  tagsFieldName?: string;
  groupSelectorName?: string;
  placeholder?: string;
}

/** Tag Select/Create field. */
function TagSelect({
  value,
  onChange,
  resourcePath,
  invalid,
  groupSelectorName = "group",
  tagsFieldName = "tags",
  placeholder
}: TagSelectProps) {
  const { formatMessage } = useDinaIntl();
  const { isAdmin, groupNames } = useAccount();

  /** The value of the input element. */
  const [inputValue, setInputValue] = useState("");

  const typeName = last(resourcePath?.split("/"));

  const filter = filterBy(
    [tagsFieldName],
    !isAdmin
      ? {
          extraFilters: [
            // Restrict the list to just the user's groups:
            {
              selector: groupSelectorName,
              comparison: "=in=",
              arguments: groupNames || []
            }
          ]
        }
      : undefined
  );

  const { loading, response } = useQuery<KitsuResource[]>(
    {
      path: resourcePath ?? "",
      sort: "-createdOn",
      fields: typeName ? { [typeName]: tagsFieldName } : undefined,
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
      uniq(
        compact((response?.data ?? []).flatMap((it) => get(it, tagsFieldName)))
      )
        .filter((tag) => tag.includes(inputValue))
        .map((tag) => ({ label: tag, value: tag })),
    [response]
  );

  function toOption(tagText: string): TagSelectOption {
    return { label: tagText, value: tagText };
  }

  const selectedOptions = (value ?? []).map(toOption);

  const customStyle: any = {
    multiValueLabel: (base) => ({ ...base, cursor: "move" }),
    placeholder: (base) => ({ ...base, color: "rgb(87,120,94)" }),
    control: (base) => ({
      ...base,
      ...(invalid && {
        borderColor: "rgb(148, 26, 37)",
        "&:hover": { borderColor: "rgb(148, 26, 37)" }
      })
    })
  };

  function setAsStringArray(selected: TagSelectOption[]) {
    onChange(selected.map((option) => option.value));
  }

  const onSortEnd = ({ oldIndex, newIndex }) => {
    onChange(arrayMove(value ?? [], oldIndex, newIndex));
  };

  return (
    <SortableSelect
      // Input value:
      inputValue={inputValue}
      onInputChange={(newVal) => setInputValue(newVal)}
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
      classNamePrefix="react-select"
      isMulti={true}
      isLoading={loading}
      allowCreateWhileLoading={true}
      isClearable={true}
      placeholder={
        placeholder || formatMessage("typeNewTagOrSearchPreviousTags")
      }
      noOptionsMessage={() => formatMessage("typeNewTagOrSearchPreviousTags")}
      formatCreateLabel={(input) => `${formatMessage("add")} "${input}"`}
      // react-sortable-hoc config:
      axis="xy"
      onSortEnd={onSortEnd}
      components={{
        MultiValue: SortableMultiValue
      }}
      distance={4}
    />
  );
}

// Drag/drop re-ordering support copied from https://github.com/JedWatson/react-select/pull/3645/files
function arrayMove(array: any[], from: number, to: number) {
  array = array.slice();
  array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
  return array;
}
const SortableMultiValue = SortableElement(reactSelectComponents.MultiValue);
const SortableSelect = SortableContainer(CreatableSelect);

export interface TagSelectReadOnlyProps {
  resourcePath?: string;
  tagsFieldName?: string;
  groupSelectorName?: string;
}

export function TagSelectReadOnly({
  resourcePath,
  tagsFieldName = "tags",
  groupSelectorName = "group"
}: TagSelectReadOnlyProps) {
  return (
    <div>
      <TagSelectField
        resourcePath={resourcePath}
        name={tagsFieldName}
        removeLabel={true}
        groupSelectorName={groupSelectorName}
      />
    </div>
  );
}
