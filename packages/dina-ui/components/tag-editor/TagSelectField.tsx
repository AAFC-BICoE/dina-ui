import {
  FieldWrapper,
  FieldWrapperProps,
  Tooltip,
  filterBy,
  rsql,
  useAccount,
  useQuery
} from "common-ui";
import { KitsuResource } from "kitsu";
import { compact, last, uniq, get } from "lodash";
import { useMemo, useRef, useState } from "react";
import { AiFillTag } from "react-icons/ai";
import { components as reactSelectComponents } from "react-select";
import CreatableSelect from "react-select/creatable";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { useFormikContext } from "formik";
import { useElasticSearchDistinctTerm } from "../../../common-ui/lib/list-page/useElasticSearchDistinctTerm";
import { useDebounce } from "use-debounce";

export interface TagSelectFieldProps extends FieldWrapperProps {
  /** The API path to search for previous tags. */
  resourcePath?: string;
  groupSelectorName?: string;
  /** The field name to use when finding other tags via RSQL filter. */
  tagsFieldName?: string;
  indexName?: string;
}

export interface TagSelectOption {
  label: string;
  value: string;
}

/** Tag Select/Create field hooked into Formik. */
export function TagSelectField({
  resourcePath,
  tagsFieldName,
  indexName,
  ...props
}: TagSelectFieldProps) {
  return (
    <FieldWrapper
      {...props}
      readOnlyRender={(tagsVal) =>
        !!tagsVal?.length && (
          <div className="d-flex flex-wrap gap-2 float-end">
            {(tagsVal ?? []).map((tag, index) => (
              <Tooltip
                key={index}
                visibleElement={
                  <div
                    className="card pill py-1 px-2 flex-row align-items-center gap-1"
                    style={{ background: "rgb(24, 102, 109)" }}
                  >
                    <AiFillTag className="text-white" />
                    <span className="text-white">{tag}</span>
                  </div>
                }
                id="tag"
                disableSpanMargin={true}
              />
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
          indexName={indexName}
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
  indexName?: string;
}

/** Tag Select/Create field. */
function TagSelect({
  value,
  onChange,
  resourcePath,
  invalid,
  groupSelectorName = "group",
  tagsFieldName = "tags",
  placeholder,
  indexName
}: TagSelectProps) {
  const { formatMessage } = useDinaIntl();
  const { isAdmin, groupNames } = useAccount();

  /** The value of the input element. */
  const [inputValue, setInputValue] = useState("");
  /** The debounced input value passed to the fetcher. */
  const [debouncedInputValue] = useDebounce(inputValue, 250);
  const tagOptions = useRef<TagSelectOption[]>([]);
  const isLoading = useRef<boolean>(false);

  const typeName = last(resourcePath?.split("/"));

  if (indexName) {
    const suggestions = useElasticSearchDistinctTerm({
      fieldName: `data.attributes.${tagsFieldName}`,
      indexName,
      keywordMultiFieldSupport: true,
      isFieldArray: true,
      inputValue: debouncedInputValue,
      groupNames,
      size: 10
    });
    tagOptions.current = suggestions.map((tag) => toOption(tag));
  } else {
    const { loading } = useQuery<KitsuResource[]>(
      {
        path: resourcePath ?? "",
        sort: "-createdOn",
        fields: typeName ? { [typeName]: tagsFieldName } : undefined,
        filter: {
          tags: { NEQ: "null" },
          ...(!isAdmin &&
            filterBy([tagsFieldName], {
              extraFilters: [
                // Restrict the list to just the user's groups:
                {
                  selector: groupSelectorName,
                  comparison: "=in=",
                  arguments: groupNames || []
                }
              ]
            }))
        },
        page: { limit: 100 }
      },
      {
        disabled: !resourcePath,
        onSuccess(response) {
          const tags = uniq(
            compact(
              (response?.data ?? []).flatMap((it) => get(it, tagsFieldName))
            )
          )
            .filter((tag) => tag.includes(inputValue))
            .map((tag) => toOption(tag));
          tagOptions.current = tags;
        }
      }
    );
    isLoading.current = loading;
  }

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
          options: tagOptions.current
        }
      ]}
      isLoading={isLoading.current}
      // Select config:
      styles={customStyle}
      classNamePrefix="react-select"
      isMulti={true}
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
  const { values } = useFormikContext<any>();
  return (
    <>
      {values?.[tagsFieldName] && values?.[tagsFieldName].length !== 0 && (
        <div className="ms-auto">
          <TagSelectField
            resourcePath={resourcePath}
            name={tagsFieldName}
            removeLabel={true}
            groupSelectorName={groupSelectorName}
            removeBottomMargin={true}
          />
        </div>
      )}
    </>
  );
}
