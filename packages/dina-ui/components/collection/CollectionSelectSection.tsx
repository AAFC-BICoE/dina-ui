import {
  DinaFormSection,
  filterBy,
  ResourceSelectField,
  useDinaFormContext,
  useAccount,
  Tooltip
} from "common-ui";
import { FaInbox } from "react-icons/fa";
import { Collection } from "../../../dina-ui/types/collection-api/resources/Collection";
import { DinaMessage } from "../../intl/dina-ui-intl";
import Link from "next/link";

export interface CollectionSelectSectionProps {
  resourcePath?: string;
  classNames?: string;
}

export function CollectionSelectSection({
  resourcePath,
  classNames
}: CollectionSelectSectionProps) {
  const { readOnly } = useDinaFormContext();
  return readOnly ? (
    <CollectionSelectField resourcePath={resourcePath} />
  ) : (
    <div className={`${classNames} row`}>
      <DinaFormSection horizontal="flex">
        <div className="d-flex flex-row gap-1">
          <CollectionSelectField
            resourcePath={resourcePath}
            className="flex-grow-1 mb-2"
          />
        </div>
      </DinaFormSection>
    </div>
  );
}

export interface CollectionSelectFieldProps {
  resourcePath?: string;
  className?: string;
}

export function CollectionSelectField({
  resourcePath,
  className
}: CollectionSelectFieldProps) {
  const { readOnly } = useDinaFormContext();
  const { isAdmin, groupNames } = useAccount();

  const filter = filterBy(
    ["name"],
    !isAdmin
      ? {
          extraFilters: [
            // Restrict the list to just the user's groups:
            {
              selector: "group",
              comparison: "=in=",
              arguments: groupNames || []
            }
          ]
        }
      : undefined
  );

  return (
    <DinaFormSection horizontal={"flex"} readOnly={readOnly}>
      <ResourceSelectField<Collection>
        key={String(isAdmin)}
        name="collection"
        customName="collection"
        readOnlyLink="/collection/collection/view?id="
        filter={filter}
        model={resourcePath as any}
        className={"collection-field " + (className || "")}
        optionLabel={(coll) =>
          `${coll.name || coll.id}${coll.code ? ` (${coll.code})` : ""}`
        }
        hideLabel={readOnly}
        removeLabel={readOnly}
        removeBottomMargin={true}
        disableTemplateCheckbox={true}
        label={
          <span>
            <FaInbox className="me-1" /> <DinaMessage id="collection" />
          </span>
        }
        readOnlyRender={(value, _) => (
          <>
            {value?.id && (
              <div className="d-flex flex-row mb-3 me-2">
                <Tooltip
                  visibleElement={
                    <div className="card pill py-1 px-2 d-flex flex-row align-items-center gap-1 label-default label-outlined">
                      <FaInbox />
                      <Link
                        href={"/collection/collection/view?id=" + value?.id}
                      >
                        {value?.name || value?.id}
                        {value?.code ? ` (${value.code})` : ""}
                      </Link>
                    </div>
                  }
                  id="collection"
                  disableSpanMargin={true}
                />
              </div>
            )}
          </>
        )}
      />
    </DinaFormSection>
  );
}
