import { Config, ImmutableTree } from "react-awesome-query-builder";
import { SortingRule } from "react-table";
import { RecoilState, atom } from "recoil";
import { DEFAULT_PAGE_SIZE, DEFAULT_SORT, LimitOffsetPageSpec } from "..";

export const searchResultsState: RecoilState<any[]> = atom({
  key: "searchResults",
  default: []
});

export const totalRecordsState: RecoilState<number> = atom({
  key: "totalRecordsState",
  default: 0
});

export const queryTreeState: RecoilState<ImmutableTree> = atom({
  key: "queryTreeState"
});

export const queryConfigState: RecoilState<Config> = atom({
  key: "queryConfigState"
});

export const loadingState: RecoilState<boolean> = atom({
  key: "loadingState",
  default: true
});

export const errorState: RecoilState<any> = atom({
  key: "errorState"
});

export const paginationState: RecoilState<LimitOffsetPageSpec> = atom({
  key: "paginationState",
  default: {
    limit: DEFAULT_PAGE_SIZE,
    offset: 0
  }
});

export const sortingRulesState: RecoilState<SortingRule[]> = atom({
  key: "sortingRuleState",
  default: DEFAULT_SORT
});
