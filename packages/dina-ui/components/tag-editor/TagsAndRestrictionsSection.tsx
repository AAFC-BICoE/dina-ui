import { DinaFormSection, ToggleField } from "common-ui";
import { AiFillTags } from "react-icons/ai";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { TagSelectField } from "./TagSelectField";

export interface TagsAndRestrictionsSection {
  resourcePath?: string;
  tagsFieldName?: string;
}

export function TagsAndRestrictionsSection({
  resourcePath,
  tagsFieldName = "tags"
}: TagsAndRestrictionsSection) {
  return (
    <div className="row">
      <DinaFormSection horizontal="flex">
        <TagSelectField
          resourcePath={resourcePath}
          className="col-sm-6"
          name={tagsFieldName}
          label={
            <span>
              <AiFillTags /> <DinaMessage id="tags" />
            </span>
          }
        />
        <ToggleField className="col-sm-6" name="publiclyReleasable" />
      </DinaFormSection>
    </div>
  );
}
