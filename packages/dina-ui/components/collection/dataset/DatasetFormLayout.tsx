import {
  DateField,
  FieldSet,
  MultilingualDescription,
  MultilingualTitle,
  NumberField,
  ResourceSelectField,
  SelectField,
  StringArrayField,
  TextField,
  useDinaFormContext
} from "common-ui";
import { GroupSelectField, PersonSelectField } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  Award,
  DatasetType,
  KeywordSet,
  TaxonomicCoverage
} from "../../../types/collection-api";
import { AgentRole } from "../../../types/loan-transaction-api";
import { License } from "../../../types/objectstore-api";
import { InlineArrayField, InlineRowCtx } from "../InlineArrayField";

const DATASET_TYPE_OPTIONS: { label: string; value: DatasetType }[] = [
  { label: "DWCA", value: "DWCA" }
];

/** Role value paired with its message key, so the keys stay type-checked. */
const DATASET_AGENT_ROLE_OPTIONS = [
  { value: "creator", labelKey: "datasetAgentRole_creator" },
  { value: "metadataProvider", labelKey: "datasetAgentRole_metadataProvider" },
  { value: "contact", labelKey: "datasetAgentRole_contact" },
  { value: "associatedParty", labelKey: "datasetAgentRole_associatedParty" },
  { value: "publisher", labelKey: "datasetAgentRole_publisher" }
] as const;

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
            <TextField
              className="col-md-6"
              name="usageRights.licenseName"
              customName="licenseName"
            />
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
            name="usageRights.usageTerms"
            customName="usageTerms"
            multiLines={true}
          />
        </div>
      </FieldSet>

      <InlineArrayField<KeywordSet>
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
          <TextField
            name="coverage.geographic.geographicDescription"
            customName="geographicDescription"
          />
          <div className="row">
            <NumberField
              className="col-md-3"
              name="coverage.geographic.boundingBox.west"
              customName="west"
            />
            <NumberField
              className="col-md-3"
              name="coverage.geographic.boundingBox.south"
              customName="south"
            />
            <NumberField
              className="col-md-3"
              name="coverage.geographic.boundingBox.east"
              customName="east"
            />
            <NumberField
              className="col-md-3"
              name="coverage.geographic.boundingBox.north"
              customName="north"
            />
          </div>
        </FieldSet>

        <FieldSet
          id="dataset-temporal-coverage-section"
          legend={<DinaMessage id="datasetTemporalCoverage" />}
        >
          <div className="row">
            <DateField
              className="col-md-6"
              name="coverage.temporal.beginDate"
              customName="beginDate"
            />
            <DateField
              className="col-md-6"
              name="coverage.temporal.endDate"
              customName="endDate"
            />
          </div>
        </FieldSet>

        <InlineArrayField<TaxonomicCoverage>
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
        <StringArrayField name="methods.methodSteps" customName="methodSteps" />
        <div className="row">
          <TextField
            className="col-md-6"
            name="methods.sampling.studyExtent"
            customName="studyExtent"
            multiLines={true}
          />
          <TextField
            className="col-md-6"
            name="methods.sampling.samplingDescription"
            customName="samplingDescription"
            multiLines={true}
          />
        </div>
        <StringArrayField
          name="methods.qualityControlDescriptions"
          customName="qualityControlDescriptions"
        />
      </FieldSet>

      <FieldSet
        id="dataset-project-section"
        legend={<DinaMessage id="datasetProject" />}
      >
        <div className="row">
          <TextField
            className="col-md-6"
            name="project.title"
            customName="title"
          />
          <TextField
            className="col-md-6"
            name="project.funding"
            customName="funding"
          />
        </div>
        <TextField
          name="project.abstractText"
          customName="abstractText"
          multiLines={true}
        />
        <div className="row">
          <TextField
            className="col-md-6"
            name="project.studyAreaDescription"
            customName="studyAreaDescription"
            multiLines={true}
          />
          <TextField
            className="col-md-6"
            name="project.designDescription"
            customName="designDescription"
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

        <InlineArrayField<Award>
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
