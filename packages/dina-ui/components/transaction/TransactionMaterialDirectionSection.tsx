import { DinaFormSection, Tooltip } from "common-ui";
import { FaLongArrowAltUp, FaLongArrowAltDown } from "react-icons/fa";
import Link from "next/link";

export interface TransactionMaterialDirectionSectionProps {
  transactionElasticQuery: any;
}
export enum MaterialDirection {
  IN = "IN",
  OUT = "OUT"
}

export function TransactionMaterialDirectionSection({
  transactionElasticQuery
}: TransactionMaterialDirectionSectionProps) {
  const transactionData =
    transactionElasticQuery?.hits?.hits?.[0]?._source?.data;
  const materialDirectionIconProps = {
    style: { cursor: "pointer" },
    onMouseOver: (event) => (event.currentTarget.style.color = "blue"),
    onMouseOut: (event) => (event.currentTarget.style.color = "")
  };

  return transactionData ? (
    <DinaFormSection horizontal={"flex"}>
      <Tooltip
        id="materialDirection_tooltip"
        intlValues={{
          materialDirection: transactionData.attributes.materialDirection
        }}
        disableSpanMargin={true}
        visibleElement={
          <div className="card pill d-flex flex-row align-items-center mb-3 py-1 px-2 gap-1">
            <Link
              href={`/loan-transaction/transaction/view?id=${transactionData.id}`}
              legacyBehavior
            >
              {transactionData.attributes.materialDirection ===
              MaterialDirection.OUT ? (
                <FaLongArrowAltUp {...materialDirectionIconProps} />
              ) : (
                <FaLongArrowAltDown {...materialDirectionIconProps} />
              )}
            </Link>
            {transactionData.attributes.transactionNumber && (
              <Link
                href={`/loan-transaction/transaction/view?id=${transactionData.id}`}
              >
                {transactionData.attributes.transactionNumber}
              </Link>
            )}
          </div>
        }
      />
    </DinaFormSection>
  ) : (
    <></>
  );
}
