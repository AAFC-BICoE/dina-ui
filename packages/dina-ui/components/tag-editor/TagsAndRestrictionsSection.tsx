import {
  DinaFormSection,
  InverseToggleField,
  TextField,
  ToggleField,
  Tooltip
} from "common-ui";
import { Field } from "formik";
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
        <div className="col-sm-6">
          <InverseToggleField
            name="publiclyReleasable"
            label={
              <>
                <DinaMessage id="notPubliclyReleasable" />
                <Tooltip id="field_publiclyReleasable_tooltip" />
              </>
            }
          />
          <DinaFormSection horizontal={false}>
            <Field name="publiclyReleasable">
              {({ field: { value: pr } }) =>
                !pr ? (
                  <TextField
                    name="notPubliclyReleasableReason"
                    className="flex-grow-1"
                    multiLines={true}
                  />
                ) : null
              }
            </Field>
          </DinaFormSection>
        </div>
      </DinaFormSection>
    </div>
  );
}
