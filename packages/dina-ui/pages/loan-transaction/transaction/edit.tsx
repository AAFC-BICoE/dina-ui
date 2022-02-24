import {
  AutoSuggestTextField,
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  DinaFormSection,
  FieldSet,
  NumberField,
  RadioButtonsField,
  StringArrayField,
  SubmitButton,
  TextField,
  ToggleField,
  useApiClient,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { TabbedArrayField } from "../../../components/collection/TabbedArrayField";
import { TagSelectField } from "../../../components/tag-editor/TagSelectField";
import { Person } from "../../../types/objectstore-api";
import {
  GroupSelectField,
  Head,
  Nav,
  PersonSelectField
} from "../../../components";
import { ManagedAttributesEditor } from "../../../components/object-store/managed-attributes/ManagedAttributesEditor";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { AgentRole, Transaction } from "../../../types/loan-transaction-api";

export interface TransactionFormProps {
  fetchedTransaction?: Transaction;
  onSaved: (transaction: PersistedResource<Transaction>) => Promise<void>;
}

export function useTransactionQuery(id?: string, showPermissions?: boolean) {
  return useQuery<Transaction>(
    {
      path: `loan-transaction-api/transaction/${id}`,
      ...(showPermissions && { header: { "include-dina-permission": "true" } })
    },
    {
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
      <main className="container">
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

  const onSubmit: DinaFormOnSubmit<InputResource<Transaction>> = async ({
    submittedValues
  }) => {
    const transactionInput: InputResource<Transaction> = {
      ...submittedValues,
      // Convert the Agent objects to UUIDs for submission to the back-end:
      agentRoles: submittedValues.agentRoles?.map(agentRole => ({
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
    <ButtonBar>
      <BackButton
        entityId={fetchedTransaction?.id}
        entityLink="/loan-transaction/transaction"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm<InputResource<Transaction>>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {buttonBar}
      <TransactionFormLayout />
      {buttonBar}
    </DinaForm>
  );
}

export function TransactionFormLayout() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <div className="row">
        <GroupSelectField
          name="group"
          className="col-sm-6"
          enableStoredDefaultGroup={true}
        />
      </div>
      <FieldSet legend={<DinaMessage id="transactionDetails" />}>
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
          <ToggleField name="materialToBeReturned" className="col-6 col-md-3" />
        </div>
        <div className="row">
          <div className="col-md-6">
            <AutoSuggestTextField<Transaction>
              name="transactionType"
              query={(search, ctx) => ({
                path: "loan-transaction-api/transaction",
                filter: {
                  ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
                  rsql: `transactionType==${search}*`
                }
              })}
              alwaysShowSuggestions={true}
              suggestion={transaction => transaction?.transactionType}
            />
            <TextField name="transactionNumber" />
          </div>
          <div className="col-md-6">
            <StringArrayField name="otherIdentifiers" />
          </div>
        </div>
        <div className="row">
          <AutoSuggestTextField<Transaction>
            className="col-sm-6"
            name="status"
            query={(search, ctx) => ({
              path: "loan-transaction-api/transaction",
              filter: {
                ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
                rsql: `status==${search}*`
              }
            })}
            alwaysShowSuggestions={true}
            suggestion={transaction => transaction?.status}
          />
          <AutoSuggestTextField<Transaction>
            className="col-sm-6"
            name="purpose"
            query={(search, ctx) => ({
              path: "loan-transaction-api/transaction",
              filter: {
                ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
                rsql: `purpose==${search}*`
              }
            })}
            alwaysShowSuggestions={true}
            suggestion={transaction => transaction?.purpose}
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
      <ShipmentDetailsFieldSet fieldName="shipment" />
      <DinaFormSection
        // Disabled the template's restrictions for this section:
        enabledFields={null}
      >
        <ManagedAttributesEditor
          valuesPath="managedAttributes"
          managedAttributeApiPath="loan-transaction-api/managed-attribute"
          fieldSetProps={{
            legend: <DinaMessage id="managedAttributes" />
          }}
        />
      </DinaFormSection>
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
        <AutoSuggestTextField<Transaction>
          className="col-sm-6"
          {...fieldProps("status")}
          query={(search, ctx) => ({
            path: "loan-transaction-api/transaction",
            filter: {
              ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
              rsql: `${fieldName}.status==${search}*`
            }
          })}
          alwaysShowSuggestions={true}
          suggestion={transaction => transaction?.shipment?.status}
        />
        <AutoSuggestTextField<Transaction>
          className="col-sm-6"
          {...fieldProps("packingMethod")}
          query={(search, ctx) => ({
            path: "loan-transaction-api/transaction",
            filter: {
              ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
              rsql: `${fieldName}.packingMethod==${search}*`
            }
          })}
          alwaysShowSuggestions={true}
          suggestion={transaction => transaction?.shipment?.packingMethod}
        />
        <TextField {...fieldProps("trackingNumber")} className="col-sm-6" />
      </div>
      <FieldSet
        legend={<DinaMessage id="shipmentAddress" />}
        style={{ backgroundColor: "#f3f3f3" }}
      >
        <div className="row">
          <AutoSuggestTextField<Transaction>
            className="col-sm-6"
            {...fieldProps("address.receiverName")}
            query={(search, ctx) => ({
              path: "loan-transaction-api/transaction",
              filter: {
                ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
                rsql: `${fieldName}.address.receiverName==${search}*`
              }
            })}
            alwaysShowSuggestions={true}
            suggestion={transaction =>
              transaction?.shipment?.address?.receiverName
            }
          />
          <AutoSuggestTextField<Transaction>
            className="col-sm-6"
            {...fieldProps("address.companyName")}
            query={(search, ctx) => ({
              path: "loan-transaction-api/transaction",
              filter: {
                ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
                rsql: `${fieldName}.address.companyName==${search}*`
              }
            })}
            alwaysShowSuggestions={true}
            suggestion={transaction =>
              transaction?.shipment?.address?.companyName
            }
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
  const { response } = useQuery<Person>({
    path: `agent-api/person/${id}`
  });

  return <>{response?.data?.displayName ?? id}</>;
}
