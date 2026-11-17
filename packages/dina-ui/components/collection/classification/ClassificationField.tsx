import { LoadingSpinner } from "common-ui";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import {
  ClassificationItem,
  ClassificationItemWithId,
  ScientificNameSourceDetails
} from "../../../types/collection-api";
import useVocabularyOptions from "../useVocabularyOptions";
import { ClassificationInputRow } from "./ClassificationInputRow";
import { DinaMessage } from "../../../intl/dina-ui-intl";

export interface IClassificationFieldProps {
  onChange?: (
    newValue?: (ClassificationItem & { isManual: boolean }) | null
  ) => void;
  initValue: ScientificNameSourceDetails;
}

export function ClassificationField({
  onChange,
  initValue
}: IClassificationFieldProps) {
  const pathArray = initValue.classificationPath?.split("|");
  const rankArray = initValue.classificationRanks?.split("|");
  const initClassifications: ClassificationItemWithId[] = [];
  if (pathArray && rankArray) {
    for (let i = 0; i < pathArray.length; i++) {
      initClassifications.push({
        id: crypto.randomUUID(),
        classificationPath: pathArray[i],
        classificationRanks: rankArray[i]
      });
    }
  } else {
    initClassifications.push({
      id: crypto.randomUUID(),
      classificationRanks: undefined,
      classificationPath: undefined
    });
  }
  const [manualClassificationItems, setManualClassificationItems] =
    useState<ClassificationItemWithId[]>(initClassifications);

  const { loading, vocabOptions: taxonomicRankOptions } = useVocabularyOptions({
    path: "collection-api/vocabulary2/taxonomicRank"
  });

  function splitClassificationItems(items: ClassificationItem[]) {
    const strRanks = items
      .map((item) => item.classificationRanks ?? "")
      .join("|");
    const strPath = items
      .map((item) => item.classificationPath ?? "")
      .join("|");

    onChange?.(
      strPath === "" && strRanks === ""
        ? { isManual: true }
        : {
            classificationPath: strPath,
            classificationRanks: strRanks,
            isManual: true
          }
    );
  }

  function onAddRow() {
    const newItems = [
      ...manualClassificationItems,
      ...[
        {
          id: crypto.randomUUID(),
          classificationPath: undefined,
          classificationRanks: undefined
        }
      ]
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
      manualClassificationItems[row].classificationPath =
        manualClassificationItem.classificationPath;
      manualClassificationItems[row].classificationRanks =
        manualClassificationItem.classificationRanks;
      const newItems = clearInvalidClassificationItems([
        ...manualClassificationItems
      ]);
      setManualClassificationItems(newItems);
      splitClassificationItems(newItems);
    }
  }

  function clearInvalidClassificationItems(items: ClassificationItemWithId[]) {
    let prevIndex = -1;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const curIndex = taxonomicRankOptions.findIndex(
        (rank) => rank.value === item.classificationRanks
      );
      if (curIndex <= prevIndex) {
        item.classificationRanks = undefined;
      } else {
        prevIndex = curIndex;
      }
    }
    return items;
  }

  function getRankOptions(rowIndex: number) {
    if (rowIndex === 0) {
      // this is the first row, then return full option list
      return taxonomicRankOptions;
    }
    const prevItem = manualClassificationItems[rowIndex - 1];
    if (!prevItem?.classificationRanks) {
      // if previous item is empty, then return call recursively for the one before previous one.
      return getRankOptions(rowIndex - 1);
    }
    const prevRank = prevItem?.classificationRanks;
    const prevRankIndex = taxonomicRankOptions.findIndex(
      (rank) => rank.value === prevRank
    );
    const newOptions =
      prevRankIndex < 0
        ? taxonomicRankOptions
        : taxonomicRankOptions.slice(prevRankIndex + 1);
    return newOptions;
  }

  return (
    <div className="w-100">
      <div className="d-flex flex-column gap align-items-center">
        {loading ? (
          <LoadingSpinner loading={loading} />
        ) : (
          <>
            <div className="d-flex justify-content-end w-100 mb-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                onClick={onAddRow}
              >
                <FaPlus size="0.85em" />
                <DinaMessage id="addClassificationRank" />
              </button>
            </div>
            {manualClassificationItems.map((item, idxKey) => {
              const newOptions = getRankOptions(idxKey);
              return (
                <ClassificationInputRow
                  taxonomicRanOptions={newOptions}
                  value={item}
                  onDeleteRow={onDeleteRow}
                  rowIndex={idxKey}
                  key={item.id}
                  onChange={(value) => {
                    onRowChange(idxKey, value);
                  }}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
