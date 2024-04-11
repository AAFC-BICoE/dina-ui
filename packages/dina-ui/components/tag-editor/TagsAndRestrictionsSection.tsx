import {
  DinaFormSection,
  useDinaFormContext
} from "common-ui";
import { MaterialSample } from "../../types/collection-api";
import { AiFillTags } from "react-icons/ai";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { TagSelectField } from "./TagSelectField";
import { RestrictionWarning } from "../collection/material-sample/RestrictionWarning";

export const TAG_SECTION_FIELDS: (keyof MaterialSample)[] = [
  "tags",
  "publiclyReleasable",
  "notPubliclyReleasableReason"
];

export interface TagsAndRestrictionsSection {
  resourcePath?: string;
  tagsFieldName?: string;
  groupSelectorName?: string;
}

export function TagsAndRestrictionsSection({
  resourcePath,
  groupSelectorName = "group",
  tagsFieldName = "tags"
}: TagsAndRestrictionsSection) {
  const { readOnly, initialValues } = useDinaFormContext();

  return readOnly ? (
    <>
      <div className="d-flex flex-column">
        {((initialValues.restrictionFieldsExtension &&
          initialValues.isRestricted) ||
          initialValues.tags?.length > 0) && (
          <div className="d-flex flex-row">
            <div className="flex-grow-1">
              <RestrictionWarning isRestrictionSelect={true} />
            </div>
          </div>
        )}
        {initialValues.restrictionRemarks && (
          <div className="d-flex flex-row ">
            <RestrictionWarning isRestrictionRemarks={true} />
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="row">
      <DinaFormSection horizontal="flex">
        <TagSelectField
          resourcePath={resourcePath}
          className="tags mb-3"
          name={tagsFieldName}
          groupSelectorName={groupSelectorName}
          removeBottomMargin={true}
          label={
            <span>
              <AiFillTags className="me-1" /> <DinaMessage id="tags" />
            </span>
          }
        />
      </DinaFormSection>
    </div>
  );
}
