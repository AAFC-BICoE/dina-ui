import { useAccount, useQuery, LoadingSpinner } from "common-ui";
import { FormikProps } from "formik";
import { useState } from "react";
import { ClassificationInputRow } from "./ClassificationInputRow";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { Vocabulary } from "packages/dina-ui/types/collection-api";
import useVocabularyOptions from "../useVocabularyOptions";

export interface IClassificationFieldProps {
  /** The determination index within the material sample. */
  index?: number;

  setValue?: (newValue: any) => void;

  onChange?: (selection: string | null, formik: FormikProps<any>) => void;

  formik?: FormikProps<any>;

  isDetermination?: boolean;

  initValue: string;

  /** Mock this out in tests so it gives a predictable value. */
  dateSupplier?: () => string;

  prevRank?: string;
}

export function ClassificationField({
  index,
  setValue,
  onChange,
  formik,
  isDetermination,
  initValue,
  dateSupplier,
  prevRank
}: IClassificationFieldProps) {
  const [manualClassificationItems, setManualClassificationItems] = useState<
    ManualClassificationItem[]
  >([{ classificationRanks: undefined, classificationPath: undefined }]);

  const { loading, vocabOptions: taxonomicRankOptions } = useVocabularyOptions({
    path: "collection-api/vocabulary/taxonomicRank"
  });

  function onAddRow() {
    setManualClassificationItems([
      ...manualClassificationItems,
      ...[{ classificationPath: undefined, classificationRanks: undefined }]
    ]);
  }

  function onDeleteRow(row: number) {
    manualClassificationItems.splice(row, 1);
    setManualClassificationItems([...manualClassificationItems]);
  }

  return (
    <div className="card card-body">
      <div className="d-flex flex-column gap align-items-center">
        {loading ? (
          <LoadingSpinner loading={loading} />
        ) : (
          manualClassificationItems.map((item, idxKey) => (
            <ClassificationInputRow
              taxonomicRanOptions={taxonomicRankOptions}
              value={item}
              onAddRow={onAddRow}
              onDeleteRow={onDeleteRow}
              prevRank={prevRank}
              rowIndex={idxKey}
              name=""
              key={idxKey}
              showPlusIcon={true}
            />
          ))
        )}
      </div>
    </div>
  );
}
export interface ManualClassificationItem {
  classificationRanks?: string;
  classificationPath?: string;
}
