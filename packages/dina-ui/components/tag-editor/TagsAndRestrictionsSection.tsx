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
            <div>
              <TagSelectField
                resourcePath={resourcePath}
                className="mb-3 ps-2"
                name={tagsFieldName}
                removeLabel={true}
                groupSelectorName={groupSelectorName}
              />
            </div>
          </div>
        )}
        {initialValues.restrictionRemarks && (
          <div className="d-flex flex-row">
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
            <FieldSpy<boolean> fieldName="publiclyReleasable">
              {pr =>
                pr === false ? (
                  <TextField
                    name="notPubliclyReleasableReason"
                    className="flex-grow-1 notPubliclyReleasableReason"
                    multiLines={true}
                  />
                ) : null
              }
            </FieldSpy>
          </DinaFormSection>
        </div>
      </DinaFormSection>
    </div>
  );
}
