import {
  DinaFormSection,
  InverseToggleField,
  RadioButtonsField,
  TextField,
  useBulkEditTabContext,
  useDinaFormContext
} from "common-ui";
import { Field } from "formik";
import { AiFillTags } from "react-icons/ai";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { TagSelectField } from "./TagSelectField";

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
  const { readOnly } = useDinaFormContext();
  const isInBulkEditTab = !!useBulkEditTabContext();

  return readOnly ? (
    <>
      <TagSelectField
        resourcePath={resourcePath}
        className="mb-3"
        name={tagsFieldName}
        removeLabel={true}
        removeLabelTag={true}
        groupSelectorName={groupSelectorName}
      />
    </>
  ) : (
    <div className="row">
      <DinaFormSection horizontal="flex">
        <TagSelectField
          resourcePath={resourcePath}
          className="col-sm-6"
          name={tagsFieldName}
          groupSelectorName={groupSelectorName}
          label={
            <span>
              <AiFillTags /> <DinaMessage id="tags" />
            </span>
          }
        />
        <div className="col-sm-6">
          {isInBulkEditTab ? (
            <RadioButtonsField<boolean | undefined>
              name="publiclyReleasable"
              label={<DinaMessage id="notPubliclyReleasable" />}
              options={[
                {
                  value: undefined,
                  label: <DinaMessage id="dontChangeValues" />
                },
                // True and false are reversed to show "publiclyReleasable" as "notPubliclyReleasable".
                { value: false, label: <DinaMessage id="true" /> },
                { value: true, label: <DinaMessage id="false" /> }
              ]}
            />
          ) : (
            <InverseToggleField
              name="publiclyReleasable"
              label={<DinaMessage id="notPubliclyReleasable" />}
            />
          )}
          <DinaFormSection horizontal={false}>
            <Field name="publiclyReleasable">
              {({ field: { value: pr } }) =>
                pr === false ? (
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
