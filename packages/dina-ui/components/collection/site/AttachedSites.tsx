import {
  FieldSet,
  SimpleSearchFilterBuilder,
  useDinaFormContext
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Site } from "../../../types/collection-api";
import { SingleSiteSelect } from "./SingleSiteSelect";

export default function AttachedSites() {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();

  return (
    <FieldSet legend={<DinaMessage id="collectingEventAttachedSites" />}>
      <SingleSiteSelect<Site>
        name="site"
        model="collection-api/site"
        optionLabel={(site) => site.name}
        omitNullOption={true}
        readOnlyLink="/collection/site/view?id="
        filter={(searchValue: string) =>
          SimpleSearchFilterBuilder.create<Site>()
            .searchFilter("name", searchValue)
            .build()
        }
        resourcePath={readOnly ? "/collection/site/view?id=" : undefined}
        selectName={formatMessage("selectSite")}
        emptyMessage={formatMessage("noSitesAttached")}
        mode={readOnly ? "view" : "edit"}
      />
    </FieldSet>
  );
}
