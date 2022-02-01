import { InputResource, PersistedResource } from "kitsu";
import { Transaction } from "../../../types/loan-transaction-api";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { useRouter } from "next/router";
import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  useApiClient,
  useQuery,
  withResponse
} from "common-ui";
import { Head, Nav } from "../../../components";

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
    </DinaForm>
  );
}
