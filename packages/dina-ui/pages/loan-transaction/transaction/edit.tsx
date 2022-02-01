import { InputResource, PersistedResource } from "kitsu";
import { Transaction } from "../../../types/loan-transaction-api";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { useRouter } from "next/router";
import {
  AutoSuggestTextField,
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  FieldSet,
  RadioButtonsField,
  StringArrayField,
  SubmitButton,
  TextField,
  ToggleField,
  useApiClient,
  useQuery,
  withResponse
} from "common-ui";
import { GroupSelectField, Head, Nav } from "../../../components";

interface TransactionFormProps {
  fetchedTransaction?: Transaction;
  onSaved: (transaction: PersistedResource<Transaction>) => Promise<void>;
}

export default function TransactionEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  async function goToViewPage(transaction: PersistedResource<Transaction>) {
    await router.push(
      `/loan-transaction/transaction/view?id=${transaction.id}`
    );
  }

  const title = id ? "editTransactionTitle" : "addTransactionTitle";

  const query = useQuery<Transaction>({
    path: `loan-transaction-api/transaction/${id}`
  });

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
    : { type: "transaction" };

  const onSubmit: DinaFormOnSubmit<InputResource<Transaction>> = async ({
    submittedValues
  }) => {
    const [savedTransaction] = await save<Transaction>(
      [
        {
          resource: submittedValues,
          type: "project"
        }
      ],
      { apiBaseUrl: "/loan-transaction-api" }
    );
    await onSaved(savedTransaction);
  };

  return (
    <DinaForm<InputResource<Transaction>>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar>
        <BackButton
          entityId={fetchedTransaction?.id}
          entityLink="/loan-transaction/transaction"
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <TransactionFormLayout />
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
            name="direction"
            className="col-6 col-md-3"
            options={[
              { label: formatMessage("materialIn"), value: "IN" },
              { label: formatMessage("materialOut"), value: "OUT" }
            ]}
          />
          <ToggleField name="toBeReturned" className="col-6 col-md-3" />
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
              suggestion={transaction => transaction?.transactionType ?? ""}
            />
            <AutoSuggestTextField<Transaction>
              name="transactionNumber"
              query={(search, ctx) => ({
                path: "loan-transaction-api/transaction",
                filter: {
                  ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
                  rsql: `transactionNumber==${search}*`
                }
              })}
              alwaysShowSuggestions={true}
              suggestion={transaction => transaction?.transactionNumber ?? ""}
            />
          </div>
          <div className="col-md-6">
            <StringArrayField name="otherIdentifiers" />
          </div>
        </div>
        <div className="row">
          <DateField name="dateOpened" className="col-sm-6" />
          <DateField name="dateClosed" className="col-sm-6" />
          <DateField name="dateDue" className="col-sm-6" />
        </div>
        <TextField name="transactionRemarks" multiLines={true} />
      </FieldSet>
    </div>
  );
}
