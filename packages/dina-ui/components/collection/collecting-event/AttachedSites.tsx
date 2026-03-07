import {
  FieldSet,
  SimpleSearchFilterBuilder,
  useDinaFormContext
} from "common-ui";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { Site } from "packages/dina-ui/types/collection-api";
import { FormikMultiResourceSelect } from "packages/common-ui/lib/formik-connected/FormikMultiResourceSelect";

export default function AttachedSites() {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();

  return (
    <FieldSet legend={<DinaMessage id="collectingEventAttachedSites" />}>
      <FormikMultiResourceSelect<Site>
        name="site"
        model="collection-api/site"
        optionLabel={(site) => site.name}
        placeholder="Type to search and add site"
        omitNullOption={true}
        readOnlyLink="/collection/site/view?id="
        filter={(searchValue: string) =>
          SimpleSearchFilterBuilder.create<Site>()
            .searchFilter("name", searchValue)
            .build()
        }
        resourceLink="/collection/site/view?id="
        selectName={formatMessage("selectSite")}
        emptyMessageId="noSitesAttached"
        mode={readOnly ? "view" : "edit"}
      />
    </FieldSet>
  );
}
