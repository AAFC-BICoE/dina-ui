import { ColumnDef } from "@tanstack/react-table";
import {
  AutoSuggestTextField,
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  FieldSet,
  FieldSpy,
  NumberField,
  QueryPage,
  RadioButtonsField,
  ReactTable,
  StringArrayField,
  SubmitButton,
  TextField,
  ToggleField,
  useApiClient,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { compact, pick } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { MaterialSample } from "../../../../dina-ui/types/collection-api";
import {
  AttachmentsField,
  Footer,
  GroupSelectField,
  Head,
  Nav,
  PersonSelectField
} from "../../../components";
import { TabbedArrayField } from "../../../components/collection/TabbedArrayField";
import { useMaterialSampleRelationshipColumns } from "../../../components/collection/material-sample/useMaterialSampleRelationshipColumns";
import { ManagedAttributesEditor } from "../../../components/managed-attributes/ManagedAttributesEditor";
import { TagSelectField } from "../../../components/tag-editor/TagSelectField";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { AgentRole, Transaction } from "../../../types/loan-transaction-api";
import { Person } from "../../../types/objectstore-api";

export interface TransactionFormProps {
  fetchedTransaction?: Transaction;
  onSaved: (transaction: PersistedResource<Transaction>) => Promise<void>;
}

export function useTransactionQuery(id?: string, showPermissions?: boolean) {
  return useQuery<Transaction>(
    {
      path: `loan-transaction-api/transaction/${id}`,
      include: "attachment,materialSamples",
      ...(showPermissions && { header: { "include-dina-permission": "true" } })
    },
    {
      disabled: !id,
      onSuccess: async ({ data: transaction }) => {
        // Convert the agent UUIDs to Person objects:
        for (const agentRole of transaction.agentRoles ?? []) {
          if (typeof agentRole.agent === "string") {
            agentRole.agent = {
              id: agentRole.agent,
              type: "person"
            };
          }
        }
      }
    }
  );
}

export default function TransactionEditPage() {
  const router = useRouter();
  const id = router.query.id?.toString?.();
  const { formatMessage } = useDinaIntl();

  async function goToViewPage(transaction: PersistedResource<Transaction>) {
    await router.push(
      `/loan-transaction/transaction/view?id=${transaction.id}`
    );
  }

  const title = id ? "editTransactionTitle" : "addTransactionTitle";

  const query = useTransactionQuery(id);
  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <div>
          <h1 id="wb-cont">
            <DinaMessage id={title} />
          </h1>
          {id ? (
            withResponse(query, ({ data }) => (
              <TransactionForm
                fetchedTransaction={data}
                onSaved={goToViewPage}
              />
            ))
          ) : (
            <TransactionForm onSaved={goToViewPage} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function TransactionForm({
  onSaved,
  fetchedTransaction
}: TransactionFormProps) {
  const { save } = useApiClient();

  const initialValues: InputResource<Transaction> = fetchedTransaction
    ? { ...fetchedTransaction }
    : {
        type: "transaction",
        materialDirection: "IN",
        materialToBeReturned: false,
        agentRoles: []
      };
  // The selected resources to be used for the QueryPage.
  const [selectedResources, setSelectedResources] = useState<MaterialSample[]>(
    []
  );

  const onSubmit: DinaFormOnSubmit<InputResource<Transaction>> = async ({
    submittedValues
  }) => {
    const transactionInput: InputResource<Transaction> & {
      relationships: any;
    } = {
      ...submittedValues,
      // Convert the attachments to a 'relationships' array so it works with JSONAPI:
      attachment: undefined,
      materialSamples: undefined,
      relationships: {
        ...(submittedValues.attachment && {
          attachment: {
            data: submittedValues.attachment.map((it) => ({
              id: it.id,
              type: it.type
            }))
          }
        }),
        ...{
          materialSamples: {
            data: selectedResources.map((it) => ({
              id: it.id,
              type: "material-sample"
            }))
          }
        }
      },

      // Convert the Agent objects to UUIDs for submission to the back-end:
      agentRoles: submittedValues.agentRoles?.map((agentRole) => ({
        ...agentRole,
        agent:
          typeof agentRole.agent === "object"
            ? agentRole.agent?.id
            : agentRole.agent
      }))
    };

    const [savedTransaction] = await save<Transaction>(
      [
        {
          resource: transactionInput,
          type: "transaction"
        }
      ],
      { apiBaseUrl: "/loan-transaction-api" }
    );
    await onSaved(savedTransaction);
  };

  const buttonBar = (
    <ButtonBar className="mb-4">
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton
          entityId={fetchedTransaction?.id}
          entityLink="/loan-transaction/transaction"
        />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  );

  return (
    <DinaForm<InputResource<Transaction>>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {buttonBar}
      <TransactionFormLayout
        selectedResources={selectedResources}
        setSelectedResources={setSelectedResources}
      />
    </DinaForm>
  );
}

export interface TransactionFormLayoutProps {
  selectedResources?: MaterialSample[];
  setSelectedResources?: Dispatch<SetStateAction<MaterialSample[]>>;
}

export function TransactionFormLayout({
  selectedResources,
  setSelectedResources
}: TransactionFormLayoutProps) {
  const { formatMessage } = useDinaIntl();
  const { readOnly, initialValues } = useDinaFormContext();
  const { bulkGet } = useApiClient();
  const [selectedResourcesView, setSelectedResourcesView] = useState<
    MaterialSample[]
  >([]);
  const { ELASTIC_SEARCH_COLUMN } = useMaterialSampleRelationshipColumns();

  /**
   * Taking all of the material sample UUIDs, retrieve the material samples using a bulk get
   * operation.
   *
   * @param sampleIds array of UUIDs.
   */
  async function fetchSamples(sampleIds: string[]) {
    await bulkGet<MaterialSample>(
      sampleIds.map((id) => `/material-sample/${id}?include=organism`),
      { apiBaseUrl: "/collection-api" }
    ).then((response) => {
      const materialSamplesTransformed = compact(response).map((resource) => ({
        data: {
          attributes: pick(resource, ["materialSampleName"])
        },
        id: resource.id,
        type: resource.type,
        included: {
          organism: resource.organism
        }
      }));
      if (setSelectedResources !== undefined) {
        setSelectedResources(materialSamplesTransformed ?? []);
      }
      setSelectedResourcesView(materialSamplesTransformed ?? []);
    });
  }

  useEffect(() => {
    if (initialValues.materialSamples?.length > 0) {
      const materialSampleIds = initialValues.materialSamples.map(
        (materialSample) => {
          return materialSample.id;
        }
      );
      fetchSamples(materialSampleIds);
    }
  }, []);

  return (
    <div>
      <FieldSet legend={<DinaMessage id="transactionDetails" />}>
        {readOnly ? (
          <div className="d-flex gap-2 mb-3">
            <FieldSpy<string> fieldName="materialDirection">
              {(direction) => (
                <h2 className="my-0">
                  <div className="badge bg-primary">
                    {direction === "IN" ? (
                      <DinaMessage id="materialIn" />
                    ) : direction === "OUT" ? (
                      <DinaMessage id="materialOut" />
                    ) : (
                      direction
                    )}
                  </div>
                </h2>
              )}
            </FieldSpy>
            <FieldSpy<boolean> fieldName="materialToBeReturned">
              {(toBeReturned) =>
                toBeReturned && (
                  <h2 className="my-0">
                    <span className="badge bg-primary">
                      <DinaMessage id="toBeReturned" />
                    </span>
                  </h2>
                )
              }
            </FieldSpy>
          </div>
        ) : (
          <div className="row">
            <RadioButtonsField
              radioStyle="BUTTONS"
              name="materialDirection"
              className="col-6 col-md-3"
              options={[
                { label: formatMessage("materialIn"), value: "IN" },
                { label: formatMessage("materialOut"), value: "OUT" }
              ]}
            />
            <ToggleField
              name="materialToBeReturned"
              className="col-6 col-md-3"
            />
          </div>
        )}
        <div className="row">
          <TextField className="col-md-6" name="transactionNumber" />
          {!readOnly && (
            <GroupSelectField
              name="group"
              className="col-sm-6"
              enableStoredDefaultGroup={true}
            />
          )}
        </div>
        <div className="row">
          <div className="col-md-6">
            <AutoSuggestTextField<Transaction>
              name="transactionType"
              jsonApiBackend={{
                query: (search, ctx) => ({
                  path: "loan-transaction-api/transaction",
                  filter: {
                    ...(ctx.values.group && {
                      group: { EQ: ctx.values.group }
                    }),
                    rsql: `transactionType==${search}*`
                  }
                }),
                option: (transaction) => transaction?.transactionType
              }}
              blankSearchBackend={"json-api"}
            />
          </div>
          <div className="col-md-6">
            <StringArrayField name="otherIdentifiers" />
          </div>
        </div>
        <div className="row">
          <AutoSuggestTextField<Transaction>
            className="col-sm-6"
            name="status"
            jsonApiBackend={{
              query: (search, ctx) => ({
                path: "loan-transaction-api/transaction",
                filter: {
                  ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
                  rsql: `status==${search}*`
                }
              }),
              option: (transaction) => transaction?.status
            }}
            blankSearchBackend={"json-api"}
          />
          <AutoSuggestTextField<Transaction>
            className="col-sm-6"
            name="purpose"
            jsonApiBackend={{
              query: (search, ctx) => ({
                path: "loan-transaction-api/transaction",
                filter: {
                  ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
                  rsql: `purpose==${search}*`
                }
              }),
              option: (transaction) => transaction?.purpose
            }}
            blankSearchBackend={"json-api"}
          />
        </div>
        <div className="row">
          <DateField name="openedDate" className="col-sm-6" />
          <DateField name="closedDate" className="col-sm-6" />
          <DateField name="dueDate" className="col-sm-6" />
        </div>
        <TextField
          name="remarks"
          customName="transactionRemarks"
          multiLines={true}
        />
      </FieldSet>
      <FieldSet legend={<DinaMessage id="materialSampleListTitle" />}>
        {readOnly && (
          <>
            <strong>
              <SeqdbMessage id="selectedSamplesTitle" />
            </strong>
          </>
        )}
        <div className="mb-3">
          <QueryPage<MaterialSample>
            indexName={"dina_material_sample_index"}
            uniqueName="transaction-edit-material-sample"
            columns={ELASTIC_SEARCH_COLUMN}
            enableColumnSelector={false}
            selectionMode={!readOnly}
            selectionResources={
              readOnly ? selectedResourcesView : selectedResources
            }
            setSelectionResources={setSelectedResources}
            viewMode={readOnly}
            reactTableProps={{
              enableSorting: true,
              enableMultiSort: true
            }}
          />
        </div>
      </FieldSet>
      {readOnly ? (
        <FieldSpy<AgentRole[]> fieldName="agentRoles">
          {(agentRoles) => {
            const tableColumns: ColumnDef<AgentRole>[] = [
              {
                id: "roles",
                accessorFn: (it) => it.roles?.join(", "),
                header: () => <strong>{formatMessage("agentRole")}</strong>,
                size: 300
              },
              {
                id: "agentName",
                cell: ({ row }) =>
                  typeof row.original?.agent === "object" &&
                  row.original?.agent?.id ? (
                    <Link href={`/person/view?id=${row.original?.agent?.id}`}>
                      <a>
                        <PersonName id={row.original?.agent?.id} />
                      </a>
                    </Link>
                  ) : (
                    row.original?.agent
                  ),
                header: () => <strong>{formatMessage("agentName")}</strong>,
                size: 300
              },
              {
                id: "transactionDate",
                accessorKey: "date",
                header: () => <strong>{formatMessage("date")}</strong>,
                size: 150
              },
              {
                id: "remarks",
                accessorKey: "remarks",
                header: () => <strong>{formatMessage("agentRemarks")}</strong>
              }
            ];

            return (
              !!agentRoles?.length && (
                <FieldSet
                  legend={<DinaMessage id="agentDetails" />}
                  fieldName="agentRoles"
                >
                  <div className="mb-3">
                    <ReactTable<AgentRole>
                      columns={tableColumns}
                      data={agentRoles}
                      className="-striped"
                    />
                  </div>
                </FieldSet>
              )
            );
          }}
        </FieldSpy>
      ) : (
        <TabbedArrayField<AgentRole>
          legend={<DinaMessage id="agentDetails" />}
          name="agentRoles"
          typeName={formatMessage("agent")}
          sectionId="agent-roles-section"
          makeNewElement={() => ({})}
          renderTab={(role, index) => (
            <span className="m-3">
              {index + 1}:{" "}
              {typeof role.agent === "object" && role.agent?.id && (
                <>
                  <PersonName id={role.agent.id} />{" "}
                </>
              )}
              {role.roles?.join?.(", ")}
            </span>
          )}
          renderTabPanel={({ fieldProps }) => (
            <div>
              <div className="row">
                <TagSelectField
                  {...fieldProps("roles")}
                  resourcePath="loan-transaction/transaction"
                  tagsFieldName="agentRoles[0].roles"
                  className="col-sm-4"
                  label={<DinaMessage id="roleAction" />}
                />
                <PersonSelectField
                  {...fieldProps("agent")}
                  className="col-sm-4"
                />
                <DateField {...fieldProps("date")} className="col-sm-4" />
              </div>
              <div className="row">
                <TextField
                  {...fieldProps("remarks")}
                  className="col-sm-12"
                  label={<DinaMessage id="agentRemarks" />}
                  multiLines={true}
                />
              </div>
            </div>
          )}
        />
      )}
      <ShipmentDetailsFieldSet fieldName="shipment" />
      <ManagedAttributesEditor
        valuesPath="managedAttributes"
        managedAttributeApiPath="loan-transaction-api/managed-attribute"
        fieldSetProps={{
          legend: <DinaMessage id="managedAttributes" />
        }}
      />
      <div className="mb-3">
        <AttachmentsField
          name="attachment"
          title={<DinaMessage id="transactionAttachments" />}
          attachmentPath={`loan-transaction-api/transaction/${initialValues.id}/attachment`}
        />
      </div>
    </div>
  );
}

interface ShipmentDetailsFieldSetProps {
  fieldName?: string;
}

function ShipmentDetailsFieldSet({ fieldName }: ShipmentDetailsFieldSetProps) {
  /** Applies name prefix to field props */
  function fieldProps(name: string) {
    return {
      name: `${fieldName}.${name}`,
      // Don't use the prefix for the labels and tooltips:
      customName: name
    };
  }

  return (
    <FieldSet
      fieldName={fieldName}
      legend={<DinaMessage id="shipmentDetails" />}
    >
      <FieldSet
        legend={<DinaMessage id="contents" />}
        style={{ backgroundColor: "#f3f3f3" }}
      >
        <TextField {...fieldProps("contentRemarks")} multiLines={true} />
        <div className="row">
          <NumberField
            {...fieldProps("value")}
            className="col-sm-6"
            label={<DinaMessage id="valueCad" />}
            readOnlyRender={(val) =>
              typeof val === "string" ? `$${numberWithCommas(val)}` : val
            }
          />
          <NumberField
            {...fieldProps("itemCount")}
            className="col-sm-6"
            isInteger={true}
          />
        </div>
      </FieldSet>
      <div className="row">
        <DateField {...fieldProps("shippedOn")} className="col-sm-6" />
        <TextField {...fieldProps("status")} className="col-sm-6" />
        <TextField {...fieldProps("packingMethod")} className="col-sm-6" />
        <TextField {...fieldProps("trackingNumber")} className="col-sm-6" />
      </div>
      <FieldSet
        legend={<DinaMessage id="shipmentAddress" />}
        style={{ backgroundColor: "#f3f3f3" }}
      >
        <div className="row">
          <TextField
            {...fieldProps("address.receiverName")}
            customName="receiverName"
            className="col-sm-6"
          />
          <TextField
            {...fieldProps("address.companyName")}
            customName="companyName"
            className="col-sm-6"
          />
          <TextField
            {...fieldProps("address.addressLine1")}
            customName="addressLine1"
            className="col-sm-6"
          />
          <TextField
            {...fieldProps("address.addressLine2")}
            customName="addressLine2"
            className="col-sm-6"
          />
          <TextField
            {...fieldProps("address.city")}
            customName="city"
            className="col-sm-6"
          />
          <TextField
            {...fieldProps("address.provinceState")}
            customName="provinceState"
            className="col-sm-6"
          />
          <TextField
            {...fieldProps("address.zipCode")}
            customName="zipCode"
            className="col-sm-6"
          />
          <TextField
            {...fieldProps("address.country")}
            customName="country"
            className="col-sm-6"
          />
        </div>
        <TextField {...fieldProps("shipmentRemarks")} multiLines={true} />
      </FieldSet>
    </FieldSet>
  );
}

/** Render a Person's name given the ID. */
export function PersonName({ id }: { id: string }) {
  const query = useQuery<Person>({
    path: `agent-api/person/${id}`
  });

  return withResponse(query, ({ data: person }) => (
    <>{person.displayName ?? id}</>
  ));
}

/** Returns the number with comma separators. */
function numberWithCommas(num: string) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
