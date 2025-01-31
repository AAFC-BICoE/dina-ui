import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  DateField,
  FieldSet,
  FieldSpy,
  ReactTable,
  TextField
} from "../../../common-ui/lib";
import { DinaMessage, useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { PersonName } from "../../../dina-ui/pages/loan-transaction/transaction/edit";
import { AgentRole } from "../../../dina-ui/types/loan-transaction-api";
import { PersonSelectField } from "../resource-select-fields/resource-select-fields";
import { TagSelectField } from "../tag-editor/TagSelectField";
import { TabbedArrayField } from "./TabbedArrayField";
import { VocabularySelectField } from "./VocabularySelectField";

export interface AgentRolesFieldProps {
  fieldName: string;
  title: React.ReactElement;
  resourcePath: string;
  readOnly?: boolean;
  forContributor?: boolean;
}

export function AgentRolesField({
  fieldName,
  title,
  resourcePath,
  readOnly
}: AgentRolesFieldProps) {
  const { formatMessage } = useDinaIntl();

  return readOnly ? (
    <FieldSpy<AgentRole[]> fieldName={fieldName}>
      {(data) => {
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
            id: "remarks",
            accessorKey: "remarks",
            header: () => <strong>{formatMessage("agentRemarks")}</strong>
          }
        ];

        return (
          !!data?.length && (
            <FieldSet legend={title} fieldName={fieldName}>
              <div className="mb-3">
                <ReactTable<AgentRole>
                  columns={tableColumns}
                  data={data}
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
      legend={title}
      name={fieldName}
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
      renderTabPanel={({ fieldProps, index }) => (
        <div>
          <div className="row">
            <VocabularySelectField
              className="col-sm-6"
              {...fieldProps("roles")}
              path="collection-api/vocabulary2/projectRole"
            />
            <PersonSelectField {...fieldProps("agent")} className="col-sm-6" />
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
  );
}
