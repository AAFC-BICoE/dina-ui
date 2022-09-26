import {
  DinaFormSection,
  FieldSpy,
  InverseToggleField,
  RadioButtonsField,
  TextField,
  useBulkEditTabContext,
  useDinaFormContext
} from "common-ui";
import { MaterialSample } from "../../types/collection-api";
import { AiFillTags } from "react-icons/ai";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { TagSelectField } from "./TagSelectField";
import { RestrictionWarning } from "../collection/material-sample/RestrictionWarning";
import { useFormikContext } from "formik";

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
  const isInBulkEditTab = !!useBulkEditTabContext();
  const formik = useFormikContext<any>();

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
          <div className="d-flex flex-row mb-3">
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
          className="col-sm-6 tags"
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
            <RadioButtonsField<boolean | null>
              name="publiclyReleasable"
              label={<DinaMessage id="notPubliclyReleasable" />}
              options={[
                // null values are ignored when bulk editing:
                {
                  value: null,
                  label: <DinaMessage id="dontChangeValues" />
                },
                // True and false are reversed to show "publiclyReleasable" as "notPubliclyReleasable".
                { value: false, label: <DinaMessage id="true" /> },
                { value: true, label: <DinaMessage id="false" /> }
              ]}
            />
          ) : (
            <InverseToggleField
              className="notPubliclyReleasable"
              name="publiclyReleasable"
              label={<DinaMessage id="notPubliclyReleasable" />}
            />
          )}
          <DinaFormSection horizontal={false}>
            {!formik.values.publiclyReleasable && (
              <TextField
                name="notPubliclyReleasableReason"
                className="flex-grow-1 notPubliclyReleasableReason"
                multiLines={true}
              />
            )}
          </DinaFormSection>
        </div>
      </DinaFormSection>
    </div>
  );
}
