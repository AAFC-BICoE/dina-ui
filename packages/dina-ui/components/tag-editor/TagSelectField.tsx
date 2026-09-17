import {
  FieldWrapper,
  FieldWrapperProps,
  SimpleSearchFilterBuilder,
  Tooltip,
  useAccount,
  useBulkEditTabContext,
  useQuery,
  SortableSelect
} from "common-ui";
import { useFormikContext } from "formik";
import { KitsuResource } from "kitsu";
import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import { AiFillTag } from "react-icons/ai";
import { FaPlus, FaRightLeft } from "react-icons/fa6";
import { ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { useDebounce } from "use-debounce";
import { useElasticSearchDistinctTerm } from "../../../common-ui/lib/list-page/useElasticSearchDistinctTerm";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export interface TagSelectFieldProps extends FieldWrapperProps {
  /** The API path to search for previous tags. */
  resourcePath?: string;
  groupSelectorName?: string;
  /** The field name to use when finding other tags via filter. */
  tagsFieldName?: string;

  /** The relationship type of the tag to include in the search. Only available with elasticsearch. */
  tagIncludedType?: string;

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
  const { formatMessage } = useDinaIntl();
  const bulkCtx = useBulkEditTabContext();
  const [editMode, setEditMode] = useState<"append" | "replace">("append");

  useEffect(() => {
    if (!bulkCtx?.setAppendFields) return;

    if (editMode === "append") {
      bulkCtx.setAppendFields((prev) => new Set(prev).add(props.name));
    } else {
      bulkCtx.setAppendFields((prev) => {
        const next = new Set(prev);
        next.delete(props.name);
        return next;
      });
    }
  }, [editMode]);

  return (
    <>
      {/* Append / Replace Toggle */}
      {bulkCtx && (
        <div className="d-flex align-items-center justify-content-end mb-2">
          <ToggleButtonGroup
            type="radio"
            name={`${tagsFieldName}-edit-mode`}
            value={editMode}
            onChange={(val) => setEditMode(val)}
            size="sm"
          >
            <ToggleButton
              id={`${tagsFieldName}-mode-append`}
              value="append"
              variant={editMode === "append" ? "primary" : "outline-primary"}
              className="px-2 py-0 fs-7"
            >
              <Tooltip
                directText={formatMessage("append_tooltip")}
                placement="top"
                disableSpanMargin={true}
                visibleElement={
                  <span className="d-flex align-items-center gap-1">
                    <FaPlus /> <DinaMessage id="append" />
                  </span>
                }
              />
            </ToggleButton>
            <ToggleButton
              id={`${tagsFieldName}-mode-replace`}
              value="replace"
              variant={editMode === "replace" ? "primary" : "outline-primary"}
              className="px-2 py-0 fs-7"
            >
              <Tooltip
                directText={formatMessage("replace_tooltip")}
                placement="top"
                disableSpanMargin={true}
                visibleElement={
                  <span className="d-flex align-items-center gap-1">
                    <FaRightLeft /> <DinaMessage id="replace" />
                  </span>
                }
              />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      )}

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
        {({ value, setValue, invalid, placeholder }) =>
          indexName ? (
            <TagSelectElasticSearch
              value={value}
              onChange={setValue}
              invalid={invalid}
              resourcePath={resourcePath}
              groupSelectorName={props.groupSelectorName}
              placeholder={placeholder}
              tagsFieldName={tagsFieldName}
              tagIncludedType={props.tagIncludedType}
              indexName={indexName}
            />
          ) : (
            <TagSelect
              value={value}
              onChange={setValue}
              invalid={invalid}
              resourcePath={resourcePath}
              groupSelectorName={props.groupSelectorName}
              placeholder={placeholder}
              tagsFieldName={tagsFieldName}
              tagIncludedType={props.tagIncludedType}
            />
          )
        }
      </FieldWrapper>
    </>
  );
}

interface TagSelectProps {
  value?: string[];
  onChange: (newValue: string[]) => void;
  resourcePath?: string;
  invalid?: boolean;
  tagsFieldName?: string;
  tagIncludedType?: string;
  groupSelectorName?: string;
  placeholder?: string;
  indexName?: string;
}

interface TagSelectInnerProps extends TagSelectProps {
  tagOptions: any;
  inputValue: any;
  setInputValue: any;
  isLoading?: boolean;
}

// Tag Select/Create field hooked into Formik with elasticsearch support.
function TagSelectElasticSearch(props: TagSelectProps) {
  const { groupNames } = useAccount();
  const { tagsFieldName, tagIncludedType, indexName } = props;
  const [inputValue, setInputValue] = useState("");
  const [debouncedInputValue] = useDebounce(inputValue, 250);
  const suggestions = useElasticSearchDistinctTerm({
    fieldName: indexName
      ? tagIncludedType
        ? `included.attributes.${tagsFieldName}`
        : `data.attributes.${tagsFieldName}`
      : undefined,
    indexName: indexName ?? "",
    keywordMultiFieldSupport: true,
    isFieldArray: true,
    inputValue: debouncedInputValue,
    groupNames,
    size: 10,
    relationshipType: tagIncludedType
  });

  const tagOptions = useMemo(
    () => suggestions.map((tag) => toOption(tag)),
    [suggestions]
  );

  return (
    <TagSelectInner
      {...props}
      tagOptions={tagOptions}
      inputValue={inputValue}
      setInputValue={setInputValue}
    />
  );
}

// Tag Select/Create field hooked into Formik. Does not use elasticsearch.
function TagSelect(props: TagSelectProps) {
  const {
    resourcePath,
    groupSelectorName = "group",
    tagsFieldName = "tags"
  } = props;
  const { isAdmin, groupNames } = useAccount();

  const [inputValue, setInputValue] = useState("");
  const [tagOptions, setTagOptions] = useState<TagSelectOption[]>([]);

  const typeName = _.last(resourcePath?.split("/"));

  const match = tagsFieldName.match(/^(.+?)\[(\d+)\]\.(.+)$/);
  let parsedFieldname = tagsFieldName;
  let numberInsideBracket = -1;
  let internalTagFieldName: string | undefined = undefined;
  if (match) {
    parsedFieldname = match[1]; // "contributors"
    numberInsideBracket = Number(match[2]); // 0 (as a number)
    internalTagFieldName = match[3]; // "roles"
  }

  const { loading } = useQuery<KitsuResource[]>(
    {
      path: resourcePath ?? "",
      sort: "-createdOn",
      fields: typeName ? { [typeName]: parsedFieldname } : undefined,
      filter: SimpleSearchFilterBuilder.create()
        .where("tags", "NEQ", "null")
        .when(!isAdmin, (builder) =>
          builder.whereProvided(groupSelectorName, "IN", groupNames)
        )
        .build(),
      page: { limit: 100 }
    },
    {
      disabled: !resourcePath,
      onSuccess(response) {
        if (
          match &&
          response.data &&
          numberInsideBracket > -1 &&
          internalTagFieldName != undefined
        ) {
          const dataArray = _.uniq(
            _.compact(
              response.data
                .flatMap((it) => it[parsedFieldname])
                .flatMap((it) => it[internalTagFieldName])
            )
          );
          const tags = dataArray
            .filter((tag: string) => tag.includes(inputValue))
            .map((tag: string) => toOption(tag));
          setTagOptions(tags);
        } else {
          const tags = _.uniq(
            _.compact(
              (response?.data ?? []).flatMap((it) => _.get(it, parsedFieldname))
            )
          )
            .filter((tag) => tag.includes(inputValue))
            .map((tag) => toOption(tag));
          setTagOptions(tags);
        }
      }
    }
  );

  return (
    <TagSelectInner
      {...props}
      tagOptions={tagOptions}
      isLoading={loading}
      inputValue={inputValue}
      setInputValue={setInputValue}
    />
  );
}

/** Tag Select/Create field. */
function TagSelectInner({
  value,
  onChange,
  invalid,
  placeholder,
  tagOptions,
  inputValue,
  setInputValue,
  isLoading
}: TagSelectInnerProps) {
  const { formatMessage } = useDinaIntl();

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
          options: tagOptions
        }
      ]}
      isLoading={isLoading}
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
      isCreatable={true}
    />
  );
}

function toOption(tagText: string): TagSelectOption {
  return { label: tagText, value: tagText };
}

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
