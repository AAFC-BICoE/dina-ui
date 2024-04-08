import { LoadingSpinner } from "common-ui";
import {
  ClassificationItem,
  ScientificNameSourceDetails
} from "../../../types/collection-api";
import { useState } from "react";
import useVocabularyOptions from "../useVocabularyOptions";
import { ClassificationInputRow } from "./ClassificationInputRow";

export interface IClassificationFieldProps {
  onChange?: (
    newValue?: (ClassificationItem & { isManual: boolean }) | null
  ) => void;

  initValue: ScientificNameSourceDetails;

  prevRank?: string;
}

export function ClassificationField({
  onChange,
  initValue,
  prevRank
}: IClassificationFieldProps) {
  const pathArray = initValue.classificationPath?.split("|");
  const rankArray = initValue.classificationRanks?.split("|");
  const initClassifications: ClassificationItem[] = [];
  if (pathArray && rankArray) {
    for (let i = 0; i < pathArray.length; i++) {
      initClassifications.push({
        classificationPath: pathArray[i],
        classificationRanks: rankArray[i]
      });
    }
  } else {
    initClassifications.push({
      classificationRanks: undefined,
      classificationPath: undefined
    });
  }
  const [manualClassificationItems, setManualClassificationItems] =
    useState<ClassificationItem[]>(initClassifications);

  const { loading, vocabOptions: taxonomicRankOptions } = useVocabularyOptions({
    path: "collection-api/vocabulary/taxonomicRank"
  });

  function splitClassificationItems(items: ClassificationItem[]) {
    const strRanks = items
      .map((item) => item.classificationRanks ?? "")
      .join("|");
    const strPath = items
      .map((item) => item.classificationPath ?? "")
      .join("|");

    onChange?.({
      classificationPath: strPath,
      classificationRanks: strRanks,
      isManual: true
    });
  }

  function onAddRow() {
    const newItems = [
      ...manualClassificationItems,
      ...[{ classificationPath: undefined, classificationRanks: undefined }]
    ];
    setManualClassificationItems(newItems);
    splitClassificationItems(newItems);
  }

  function onDeleteRow(row: number) {
    manualClassificationItems.splice(row, 1);
    const newItems = [...manualClassificationItems];
    setManualClassificationItems(newItems);
    splitClassificationItems(newItems);
  }

  function onRowChange(
    row: number,
    manualClassificationItem: ClassificationItem
  ) {
    if (manualClassificationItems[row]) {
      manualClassificationItems[row] = manualClassificationItem;
      const newItems = [...manualClassificationItems];
      setManualClassificationItems(newItems);
      splitClassificationItems(newItems);
    }
  }

  return (
    <div className="card card-body">
      <div className="d-flex flex-column gap align-items-center">
        {loading ? (
          <LoadingSpinner loading={loading} />
        ) : (
          manualClassificationItems.map((item, idxKey) => {
            return (
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
                onChange={(value) => {
                  onRowChange(idxKey, value);
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
