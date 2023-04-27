import {
  BackButton,
  ButtonBar,
  CollapsibleSection,
  CustomQueryPageView,
  DeleteButton,
  DinaForm,
  EditButton,
  FieldSet,
  generateDirectMaterialSampleChildrenTree,
  materialSampleCultureStrainChildrenQuery,
  useElasticSearchQuery,
  withResponse
} from "common-ui";
import { Field } from "formik";
import { isEmpty } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import InheritedDeterminationSection from "../../../components/collection/material-sample/InheritedDeterminationSection";
import {
  AssociationsField,
  CollectingEventFormLayout,
  Footer,
  Head,
  HOST_ORGANISM_FIELDS,
  ManagedAttributesEditor,
  MaterialSampleBreadCrumb,
  MaterialSampleIdentifiersSection,
  MaterialSampleInfoSection,
  MaterialSampleStateWarning,
  Nav,
  OrganismsField,
  PreparationField,
  PREPARATION_FIELDS,
  ProjectSelectSection,
  AssemblageSelectSection,
  TagSelectReadOnly,
  SamplesView,
  ScheduledActionsField,
  StorageLinkerField,
  TagsAndRestrictionsSection,
  useCollectingEventQuery,
  useMaterialSampleQuery,
  withOrganismEditorValues,
  TransactionMaterialDirectionSection
} from "../../../components";
import { AttachmentReadOnlySection } from "../../../components/object-store/attachment-list/AttachmentReadOnlySection";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";
import { GenerateLabelDropdownButton } from "../../../components/collection/material-sample/GenerateLabelDropdownButton";
import { PersistedResource } from "kitsu";
import { SplitMaterialSampleDropdownButton } from "../../../components/collection/material-sample/SplitMaterialSampleDropdownButton";
import { DataEntryViewer } from "../../../../common-ui/lib/formik-connected/data-entry/DataEntryViewer";
import { ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW } from "../../../components/collection/material-sample/MaterialSampleRelationshipColumns";
import { MaterialSampleTransactionList } from "../../../components/transaction/MaterialSampleTransactionList";

export function MaterialSampleViewPage({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();

  const id = router.query.id?.toString();

  const materialSampleQuery = useMaterialSampleQuery(id);

  // Get info of highest parent material sample if one exists
  const highestParentId =
    materialSampleQuery.response?.data.parentMaterialSample &&
    materialSampleQuery.response?.data.hierarchy?.at(-1)?.uuid.toString();
  const highestParentMaterialSample =
    materialSampleQuery.response?.data.parentMaterialSample &&
    materialSampleQuery.response?.data.hierarchy?.at(-1)?.name;
  const highestMaterialSampleQuery = useMaterialSampleQuery(highestParentId);

  const colEventQuery = useCollectingEventQuery(
    highestParentId
      ? highestMaterialSampleQuery.response?.data?.collectingEvent?.id
      : materialSampleQuery.response?.data?.collectingEvent?.id
  );

  const collectingEventParentLink = (
    <Link href={`/collection/material-sample/view?id=${highestParentId}`}>
      <a>{highestParentMaterialSample}</a>
    </Link>
  );

  const transactionQueryDSL: any = {
    bool: {
      must: [
        {
          nested: {
            path: "included",
            query: {
              bool: {
                must: [
                  {
                    term: {
                      "included.id": id
                    }
                  },
                  {
                    term: {
                      "included.type": "material-sample"
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  };

  const transactionElasticQuery = useElasticSearchQuery({
    indexName: "dina_loan_transaction_index",
    queryDSL: {
      _source: [
        "data.id",
        "data.attributes.materialDirection",
        "data.attributes.transactionNumber"
      ],
      size: 1,
      sort: {
        "data.attributes.openedDate": {
          order: "desc"
        }
      },
      query: transactionQueryDSL
    }
  });

  return (
    <div>
      {withResponse(materialSampleQuery, ({ data: materialSampleData }) => {
        const materialSample = withOrganismEditorValues(materialSampleData);
        const buttonBar = buttonBarComponent(materialSample);
        const hasPreparations = PREPARATION_FIELDS.some(
          (fieldName) => !isEmpty(materialSample[fieldName])
        );

        const hasOrganism = materialSample?.organism?.some(
          (org) => !isEmpty(org)
        );

        const hasInheritedDetermination = hasOrganism
          ? null
          : materialSample?.hierarchy?.find((hierachyItem) =>
              hierachyItem.hasOwnProperty("organismPrimaryDetermination")
            );

        /* Consider as having association if either host organism any field has value or having any non empty association in the array */
        const hasAssociations =
          materialSample?.associations?.some((assct) => !isEmpty(assct)) ||
          HOST_ORGANISM_FIELDS.some(
            (fieldName) => materialSample.hostOrganism?.[fieldName]
          );

        return (
          <>
            <Head
              title={formatMessage("materialSampleViewTitle", {
                primaryID: materialSample?.materialSampleName
              })}
            />
            <Nav />
            <main className="container-fluid">
              <DinaForm<MaterialSample>
                initialValues={materialSample}
                readOnly={true}
              >
                {buttonBar}
                <MaterialSampleStateWarning />

                {/* Material Sample Hierarchy */}
                <MaterialSampleBreadCrumb
                  materialSample={materialSample}
                  disableLastLink={true}
                />
                <div className="d-flex flex-row gap-2">
                  <TagsAndRestrictionsSection />
                </div>
                <div className="d-flex flex-row gap-2">
                  <TagSelectReadOnly />
                  <ProjectSelectSection />
                  <AssemblageSelectSection />
                  {withResponse(
                    transactionElasticQuery as any,
                    ({ data: query }) => {
                      return (
                        <TransactionMaterialDirectionSection
                          transactionElasticQuery={query}
                        />
                      );
                    }
                  )}
                </div>

                <MaterialSampleIdentifiersSection />
                {materialSample.parentMaterialSample && (
                  <SamplesView
                    samples={[materialSample.parentMaterialSample]}
                    fieldSetId={<DinaMessage id="parentMaterialSample" />}
                  />
                )}

                {/* Custom Query View */}
                <CustomQueryPageView
                  indexName="dina_material_sample_index"
                  columns={ELASTIC_SEARCH_COLUMN_CHILDREN_VIEW}
                  localStorageKey="material-sample-children"
                  customQueryOptions={[
                    {
                      value: "materialSampleChildren",
                      labelKey: "childMaterialSamples",
                      customElasticSearch:
                        generateDirectMaterialSampleChildrenTree(id ?? "")
                    },
                    {
                      value: "cultureStrains",
                      labelKey: "childCultureStrains",
                      customElasticSearch:
                        materialSampleCultureStrainChildrenQuery(
                          materialSample?.hierarchy?.reduce((prev, current) =>
                            (prev?.rank ?? 0) > (current?.rank ?? 0)
                              ? prev
                              : current
                          )?.uuid ?? ""
                        )
                    }
                  ]}
                  reactTableProps={{
                    showPagination: false
                  }}
                  defaultPageSize={500}
                  defaultSort={[
                    { id: "data.attributes.materialSampleName", desc: false }
                  ]}
                />

                <MaterialSampleInfoSection />
                {withResponse(colEventQuery, ({ data: colEvent }) => {
                  function legendWrapper():
                    | ((legendElement: JSX.Element) => JSX.Element)
                    | undefined {
                    return (legendElement) => {
                      return (
                        <div className="d-flex align-items-center justify-content-between">
                          {legendElement}
                          <Link
                            href={`/collection/collecting-event/view?id=${colEvent.id}`}
                          >
                            <a>
                              <DinaMessage id="detailsPageLink" />
                            </a>
                          </Link>
                        </div>
                      );
                    };
                  }
                  return (
                    <FieldSet
                      legend={<DinaMessage id="collectingEvent" />}
                      wrapLegend={legendWrapper()}
                    >
                      {materialSample.parentMaterialSample && (
                        <div
                          style={{
                            marginLeft: "16px"
                          }}
                        >
                          <DinaMessage
                            id="fromParent"
                            values={{ parentLink: collectingEventParentLink }}
                          />
                        </div>
                      )}
                      <DinaForm initialValues={colEvent} readOnly={true}>
                        <CollectingEventFormLayout />
                      </DinaForm>
                    </FieldSet>
                  );
                })}
                {hasPreparations && <PreparationField />}
                {hasOrganism && <OrganismsField name="organism" />}
                {hasInheritedDetermination && (
                  <div className="row">
                    <div className="col-md-6">
                      <InheritedDeterminationSection
                        materialSample={materialSample}
                      />
                    </div>
                  </div>
                )}
                {hasAssociations && <AssociationsField />}
                {materialSample.storageUnit && (
                  <div className="card card-body mb-3">
                    <StorageLinkerField
                      name="storageUnit"
                      targetType="material-sample"
                    />
                  </div>
                )}
                {!!materialSample?.scheduledActions?.length && (
                  <ScheduledActionsField />
                )}
                <DataEntryViewer
                  name={"extensionValuesForm"}
                  legend={<DinaMessage id="fieldExtensions" />}
                  extensionValues={materialSample.extensionValues}
                  disableDinaForm={true}
                  blockOptionsEndpoint={`collection-api/extension`}
                  blockOptionsFilter={{
                    "extension.fields.dinaComponent": "MATERIAL_SAMPLE"
                  }}
                />
                <div className="row">
                  <div className="col-md-6">
                    <ManagedAttributesEditor
                      fieldSetProps={{
                        legend: (
                          <DinaMessage id="materialSampleManagedAttributes" />
                        )
                      }}
                      valuesPath="managedAttributes"
                      managedAttributeApiPath="collection-api/managed-attribute"
                      managedAttributeComponent="MATERIAL_SAMPLE"
                    />
                  </div>
                </div>

                <CollapsibleSection id="transactions" headerKey="transactions">
                  <MaterialSampleTransactionList
                    transactionQueryDSL={transactionQueryDSL}
                  />
                </CollapsibleSection>

                <div className="mb-3">
                  <Field name="id">
                    {({ field: { value: materialSampleId } }) => (
                      <AttachmentReadOnlySection
                        attachmentPath={`collection-api/material-sample/${materialSampleId}/attachment`}
                        detachTotalSelected={true}
                        title={<DinaMessage id="materialSampleAttachments" />}
                      />
                    )}
                  </Field>
                </div>
              </DinaForm>
              {buttonBar}
            </main>
          </>
        );
      })}
      <Footer />
    </div>
  );

  function buttonBarComponent(
    materialSample: PersistedResource<MaterialSample>
  ) {
    return (
      id && (
        <ButtonBar className="flex">
          <BackButton
            entityId={id}
            entityLink="/collection/material-sample"
            byPassView={true}
            className="me-auto"
            reloadLastSearch={true}
          />
          <EditButton entityId={id} entityLink="collection/material-sample" />
          <SplitMaterialSampleDropdownButton
            ids={[id]}
            disabled={!materialSample.materialSampleName}
            materialSampleType={materialSample.materialSampleType}
          />
          <GenerateLabelDropdownButton materialSample={materialSample} />
          <Link href={`/collection/material-sample/revisions?id=${id}`}>
            <a className="btn btn-info ms-5">
              <DinaMessage id="revisionsButtonText" />
            </a>
          </Link>
          <DeleteButton
            className="ms-5"
            id={id}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collection/material-sample/list?reloadLastSearch"
            type="material-sample"
          />
        </ButtonBar>
      )
    );
  }
}

export default withRouter(MaterialSampleViewPage);
