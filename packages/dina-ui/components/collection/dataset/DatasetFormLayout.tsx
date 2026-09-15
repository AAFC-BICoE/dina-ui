import {
  DateField,
  FieldSet,
  MultilingualDescription,
  MultilingualTitle,
  NumberField,
  prefixedFieldProps,
  ResourceSelectField,
  SelectField,
  StringArrayField,
  TextField,
  useDinaFormContext
} from "common-ui";
import { GroupSelectField, PersonSelectField } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  DATASET_AGENT_ROLES,
  DATASET_TYPES,
  DatasetAward,
  DatasetKeywordSet,
  DatasetTaxonomicCoverage
} from "../../../types/collection-api";
import { AgentRole } from "../../../types/loan-transaction-api";
import { License } from "../../../types/objectstore-api";
import { InlineArrayField, InlineRowCtx } from "../InlineArrayField";

const DATASET_TYPE_OPTIONS = DATASET_TYPES.map((value) => ({
  label: value,
  value
}));

/** Role value paired with its message key, so the keys stay type-checked. */
const DATASET_AGENT_ROLE_OPTIONS = DATASET_AGENT_ROLES.map((value) => ({
  value,
  labelKey: `datasetAgentRole_${value}` as const
}));

/** Shared by the agentRoles and project.personnel sections. */
function AgentRoleRow({ fieldProps }: InlineRowCtx<AgentRole>) {
  const { formatMessage } = useDinaIntl();

  return (
    <div className="row">
      <SelectField
        {...fieldProps("roles")}
        className="col-md-6"
        isMulti={true}
        label={formatMessage("agentRole")}
        options={DATASET_AGENT_ROLE_OPTIONS.map(({ value, labelKey }) => ({
          label: formatMessage(labelKey),
          value
        }))}
      />
      <PersonSelectField {...fieldProps("agent")} className="col-md-6" />
    </div>
  );
}

export function DatasetFormLayout() {
  const { readOnly } = useDinaFormContext();
  const { formatMessage, locale } = useDinaIntl();

  // Nested field paths, so labels stay keyed off the short field name:
  const rights = prefixedFieldProps("usageRights");
  const geographic = prefixedFieldProps("coverage.geographic");
  const boundingBox = prefixedFieldProps("coverage.geographic.boundingBox");
  const temporal = prefixedFieldProps("coverage.temporal");
  const methods = prefixedFieldProps("methods");
  const sampling = prefixedFieldProps("methods.sampling");
  const project = prefixedFieldProps("project");

  return (
    <div>
      <div className="row">
        <SelectField
          className="col-md-6 datasetType"
          name="datasetType"
          options={DATASET_TYPE_OPTIONS}
        />
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        )}
      </div>
      <div className="row">
        <TextField className="col-md-6" name="datasetVersion" />
        <DateField className="col-md-6" name="publicationDate" />
      </div>

      <MultilingualTitle />
      <MultilingualDescription />

      <InlineArrayField<AgentRole>
        name="agentRoles"
        sectionId="dataset-agent-roles-section"
        typeName={formatMessage("agent")}
        legend={<DinaMessage id="datasetAgentRoles" />}
        makeNewElement={() => ({})}
        renderRow={(ctx) => <AgentRoleRow {...ctx} />}
      />

      <FieldSet
        id="dataset-usage-rights-section"
        legend={<DinaMessage id="datasetUsageRights" />}
      >
        <div className="row">
          {readOnly ? (
            // The selected License isn't fetched for the read-only view, so show
            // the name that was stored alongside the URL when it was picked.
            <TextField className="col-md-6" {...rights("licenseName")} />
          ) : (
            <ResourceSelectField<License>
              className="col-md-6"
              name="license"
              filter={() => ({})}
              model="objectstore-api/license"
              optionLabel={(license) => license.titles[locale] ?? license.url}
              removeDefaultSort={true}
            />
          )}
          <TextField
            className="col-md-6"
            {...rights("usageTerms")}
            multiLines={true}
          />
        </div>
      </FieldSet>

      <InlineArrayField<DatasetKeywordSet>
        name="keywordSets"
        sectionId="dataset-keyword-sets-section"
        typeName={formatMessage("datasetKeywordSet")}
        legend={<DinaMessage id="datasetKeywordSets" />}
        makeNewElement={() => ({})}
        renderRow={({ fieldProps }) => (
          <div className="row">
            <StringArrayField
              {...fieldProps("keywords")}
              className="col-md-6"
            />
            <TextField {...fieldProps("thesaurus")} className="col-md-6" />
          </div>
        )}
      />

      <FieldSet
        id="dataset-coverage-section"
        legend={<DinaMessage id="datasetCoverage" />}
      >
        <FieldSet
          id="dataset-geographic-coverage-section"
          legend={<DinaMessage id="datasetGeographicCoverage" />}
        >
          <TextField {...geographic("geographicDescription")} />
          <div className="row">
            <NumberField className="col-md-3" {...boundingBox("west")} />
            <NumberField className="col-md-3" {...boundingBox("south")} />
            <NumberField className="col-md-3" {...boundingBox("east")} />
            <NumberField className="col-md-3" {...boundingBox("north")} />
          </div>
        </FieldSet>

        <FieldSet
          id="dataset-temporal-coverage-section"
          legend={<DinaMessage id="datasetTemporalCoverage" />}
        >
          <div className="row">
            <DateField className="col-md-6" {...temporal("beginDate")} />
            <DateField className="col-md-6" {...temporal("endDate")} />
          </div>
        </FieldSet>

        <InlineArrayField<DatasetTaxonomicCoverage>
          name="coverage.taxonomic"
          sectionId="dataset-taxonomic-coverage-section"
          typeName={formatMessage("datasetTaxonomicCoverageItem")}
          legend={<DinaMessage id="datasetTaxonomicCoverage" />}
          makeNewElement={() => ({})}
          renderRow={({ fieldProps }) => (
            <div className="row">
              <TextField {...fieldProps("rank")} className="col-md-4" />
              <TextField
                {...fieldProps("scientificName")}
                className="col-md-4"
              />
              <TextField {...fieldProps("commonName")} className="col-md-4" />
            </div>
          )}
        />
      </FieldSet>

      <FieldSet
        id="dataset-methods-section"
        legend={<DinaMessage id="datasetMethods" />}
      >
        <StringArrayField {...methods("methodSteps")} />
        <div className="row">
          <TextField
            className="col-md-6"
            {...sampling("studyExtent")}
            multiLines={true}
          />
          <TextField
            className="col-md-6"
            {...sampling("samplingDescription")}
            multiLines={true}
          />
        </div>
        <StringArrayField {...methods("qualityControlDescriptions")} />
      </FieldSet>

      <FieldSet
        id="dataset-project-section"
        legend={<DinaMessage id="datasetProject" />}
      >
        <div className="row">
          <TextField className="col-md-6" {...project("title")} />
          <TextField className="col-md-6" {...project("funding")} />
        </div>
        <TextField {...project("abstractText")} multiLines={true} />
        <div className="row">
          <TextField
            className="col-md-6"
            {...project("studyAreaDescription")}
            multiLines={true}
          />
          <TextField
            className="col-md-6"
            {...project("designDescription")}
            multiLines={true}
          />
        </div>

        <InlineArrayField<AgentRole>
          name="project.personnel"
          sectionId="dataset-project-personnel-section"
          typeName={formatMessage("agent")}
          legend={<DinaMessage id="datasetPersonnel" />}
          makeNewElement={() => ({})}
          renderRow={(ctx) => <AgentRoleRow {...ctx} />}
        />

        <InlineArrayField<DatasetAward>
          name="project.awards"
          sectionId="dataset-project-awards-section"
          typeName={formatMessage("datasetAward")}
          legend={<DinaMessage id="datasetAwards" />}
          makeNewElement={() => ({})}
          renderRow={({ fieldProps }) => (
            <div>
              <div className="row">
                <TextField {...fieldProps("funderName")} className="col-md-6" />
                <TextField
                  {...fieldProps("awardNumber")}
                  className="col-md-6"
                />
              </div>
              <div className="row">
                <TextField {...fieldProps("title")} className="col-md-6" />
                <TextField {...fieldProps("awardUrl")} className="col-md-6" />
              </div>
              <StringArrayField {...fieldProps("funderIdentifiers")} />
            </div>
          )}
        />
      </FieldSet>

      {readOnly && (
        <div className="row">
          <DateField
            className="col-md-6"
            name="createdOn"
            showTime={true}
            label={formatMessage("field_createdOn")}
          />
          <TextField
            className="col-md-6"
            name="createdBy"
            label={formatMessage("field_createdBy")}
          />
        </div>
      )}
    </div>
  );
}
