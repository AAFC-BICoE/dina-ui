import { LoadingSpinner } from "common-ui";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import {
  ClassificationItem,
  ClassificationItemWithId,
  ScientificNameSourceDetails
} from "../../../types/collection-api";
import useVocabularyOptions from "../useVocabularyOptions";
import { ClassificationInputRow } from "./ClassificationInputRow";

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
        id: uuidv4(),
        classificationPath: pathArray[i],
        classificationRanks: rankArray[i]
      });
    }
  } else {
    initClassifications.push({
      id: uuidv4(),
      classificationRanks: undefined,
      classificationPath: undefined
    });
  }
  const [manualClassificationItems, setManualClassificationItems] =
    useState<ClassificationItemWithId[]>(initClassifications);

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
      ...[
        {
          id: uuidv4(),
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
    <div className="card card-body">
      <div className="d-flex flex-column gap align-items-center">
        {loading ? (
          <LoadingSpinner loading={loading} />
        ) : (
          <>
            <div className="d-flex w-100 my-1">
              <div className="w-100" />
              <div className="w-100 ms-2" />
              <div
                style={{
                  cursor: "pointer",
                  marginTop: "0.3rem",
                  maxWidth: "2.5rem"
                }}
              >
                <FaPlus
                  className="ms-2"
                  onClick={onAddRow}
                  size="2em"
                  onMouseOver={(event) =>
                    (event.currentTarget.style.color = "blue")
                  }
                  onMouseOut={(event) => (event.currentTarget.style.color = "")}
                />
              </div>
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
