import { UserPreference } from "packages/dina-ui/types/user-api/resources/UserPreference";
import { SortingRule } from "react-table";
import { LimitOffsetPageSpec, SelectOption } from "..";
import { TransformQueryToDSLParams } from "../util/transformToDSL";
import { ESIndexMapping } from "./types";

/**
 * Union of all the possible actions. Depending on the action it may have additional data.
 */
export type QueryPageActions =
  | { type: "PAGINATION_PAGE_CHANGE"; newPage: number }
  | { type: "PAGINATION_SIZE_CHANGE"; newSize: number }
  | { type: "SORTING_CHANGE"; newSort: SortingRule[] }
  | { type: "SEARCH_FILTER_CHANGE"; newFilter: TransformQueryToDSLParams }
  | { type: "USER_PREFERENCE_CHANGE"; newUserPreferences: UserPreference }
  | { type: "SAVED_SEARCH_CHANGE"; newSavedSearch: string }
  | { type: "INDEX_CHANGE"; index: ESIndexMapping[] }
  | { type: "SUGGESTION_CHANGE"; newSuggestions: string[] }
  | { type: "GROUP_CHANGE"; newGroups: any[] }
  | { type: "RELOAD_SUGGESTIONS" }
  | { type: "LOAD_SAVED_SEARCH" }
  | { type: "RELOAD_SAVED_SEARCH"; newSavedSearch: string }
  | { type: "SUCCESS_TABLE_DATA"; searchResults: any[]; newTotal: number }
  | { type: "ERROR"; errorLabel: string };

export interface QueryPageStates {
  /**
   * Index name, the name comes from the props of the QueryPage but we will be treating it like a
   * state to make it easier to pass to children components.
   */
  indexName: string;

  /**
   * Elastic search mapping for the index name. This should only be populated once.
   */
  elasticSearchIndex: ESIndexMapping[];

  /**
   * Groups the user can select from, this list should only be populated once per page load.
   */
  groups: any[];

  /**
   * Total number of records from the search. This leverages the elastic search count request if
   * needed.
   */
  totalRecords: number;

  /**
   * Current search filters to transform to an elastic search query.
   */
  searchFilters: TransformQueryToDSLParams;

  /**
   * Current sorting rules being applied. This will be passed to elastic search.
   *
   * Please note that multiple rules can be applied at once.
   */
  sortingRules: SortingRule[];

  /**
   * Pagination settings currently being applied. This will be passed to elastic search.
   */
  pagination: LimitOffsetPageSpec;

  /**
   * Search results to be displayed on the page.
   */
  searchResults: any[];

  /**
   * Retrieve the current user preferences. This should only be reloaded if changes were made.
   */
  userPreferences?: UserPreference;

  /**
   * If the user is used a suggested field, the suggestions will be stored here.
   */
  suggestions: string[];

  /**
   * When this state is true, the user preferences will be reloaded.
   */
  reloadUserPreferences: boolean;

  /**
   * When this state is true, a search will be performed.
   */
  performElasticSearchRequest: boolean;

  /**
   * When this state is true, perform an index request.
   */
  performIndexRequest: boolean;

  /**
   * When this state is true, the suggestions will be reloaded based on the field and groups
   * selected.
   */
  performSuggestionRequest: boolean;

  /**
   * When this state is true, the list of groups the users is part of will be reloaded. This should
   * only be loaded once per page load.
   */
  performGroupRequest: boolean;

  /**
   * Selected saved search for the saved search dropdown.
   */
  selectedSavedSearch: string;

  /**
   * When the user uses the "load" button, the selected saved search is saved here.
   */
  loadedSavedSearch?: string;

  /**
   * Used to display a loading spinner when results are being fetched. This loading is only
   * used for the elastic search results.
   */
  elasticSearchLoading: boolean;

  /**
   * Used to display a loading spinner when the query builder is loading the index.
   */
  indexLoading: boolean;

  /**
   * Used to display a loading spinner for the user preferences (saved search).
   */
  userPreferenceLoading: boolean;

  /**
   * If any error has occurred.
   */
  error?: string;
}

/**
 *
 * The reducer is used to simplify all of the possible actions that can be performed on the page.
 *
 * This is being used to help manage our state and to be able to dispatch actions in other components.
 *
 * The reducer should be a pure function with no outside API calls. When the state and action
 * props are the same when called, it should always return the same value.
 */
export function queryPageReducer(
  state: QueryPageStates,
  action: QueryPageActions
): QueryPageStates {
  // console.log("ACTION PERFORMED: " + action.type + " / Current States: " + state)
  switch (action.type) {
    /**
     * When the user changes the react-table page, it will trigger this event.
     *
     * This method will update the pagination, and since we have a useEffect hook on the pagination
     * this will trigger a new search. Using the page size we can determine the offset.
     *
     * For example:
     *    pageSize: 25
     *    newPage: 5
     *
     *    The offset would be 25 * 5 = 125.
     */
    case "PAGINATION_PAGE_CHANGE":
      return {
        ...state,
        elasticSearchLoading: true,
        pagination: {
          ...state.pagination,
          offset: state.pagination.limit * action.newPage
        },
        performElasticSearchRequest: true
      };

    /**
     * When the user changes the react-table page size, it will trigger this event.
     *
     * This method will update the pagination, and since we have a useEffect hook on the pagination
     * this will trigger a new search. This will update the pagination limit.
     */
    case "PAGINATION_SIZE_CHANGE":
      return {
        ...state,
        elasticSearchLoading: true,
        pagination: {
          offset: 0,
          limit: action.newSize
        },
        performElasticSearchRequest: true
      };

    /**
     * When the user changes the react-table page sort, it will trigger this event.
     *
     * This method will cause the useEffect with the search to trigger if the sorting has changed.
     */
    case "SORTING_CHANGE":
      return {
        ...state,
        elasticSearchLoading: true,
        sortingRules: action.newSort,
        performElasticSearchRequest: true
      };

    /**
     * On search filter submit. This will also update the pagination to go back to the first page on
     * a new search. Changing the filter does not automatically perform a search request.
     */
    case "SEARCH_FILTER_CHANGE":
      return {
        ...state,
        searchFilters: action.newFilter,
        elasticSearchLoading: true,
        pagination: {
          ...state.pagination,
          offset: 0
        },
        performElasticSearchRequest: true,
        performSuggestionRequest: true
      };

    /**
     * User preferences have been reloaded with a new value.
     */
    case "USER_PREFERENCE_CHANGE":
      return {
        ...state,
        userPreferences: action.newUserPreferences,
        reloadUserPreferences: false,
        userPreferenceLoading: false
      };

    /**
     * Action is triggered when the saved search dropdown is selected to a new value.
     *
     * The reason this value is stored, is so when the "load"/"delete" button is clicked we know
     * which saved search to perform the action on.
     */
    case "SAVED_SEARCH_CHANGE":
      return {
        ...state,
        selectedSavedSearch: action.newSavedSearch
      };

    case "INDEX_CHANGE":
      return {
        ...state,
        elasticSearchLoading: false,
        elasticSearchIndex: action.index,
        performIndexRequest: false,
        indexLoading: false
      };

    /**
     * New suggestions have been provided.
     */
    case "SUGGESTION_CHANGE":
      return {
        ...state,
        performSuggestionRequest: false,
        suggestions: action.newSuggestions
      };

    case "GROUP_CHANGE":
      return {
        ...state,
        performGroupRequest: false,
        groups: action.newGroups
      };

    /**
     * Set the performSuggestionRequest flag to true, this will cause the suggestion request to be
     * sent.
     */
    case "RELOAD_SUGGESTIONS":
      return {
        ...state,
        performSuggestionRequest: true
      };

    /**
     * Using the saved saved search, we can find the saved search in the user preference and load
     * it in.
     */
    case "LOAD_SAVED_SEARCH":
      const loadedOption =
        state.userPreferences?.savedSearches?.[state.indexName]?.[
          state.selectedSavedSearch
        ];
      return !state.selectedSavedSearch ||
        !state.userPreferences ||
        !loadedOption
        ? {
            ...state,
            error: "Could not load the saved search."
          }
        : {
            ...state,
            error: undefined,
            elasticSearchLoading: true,
            searchFilters: loadedOption,
            pagination: {
              ...state.pagination,
              offset: 0
            },
            loadedSavedSearch: state.selectedSavedSearch,
            performElasticSearchRequest: true
          };

    /**
     * Action to be performed after a saved search has been saved or a saved search was deleted.
     * The user preferences will need to be reloaded and change the current selected saved search.
     */
    case "RELOAD_SAVED_SEARCH":
      return {
        ...state,
        reloadUserPreferences: true,
        performElasticSearchRequest: true,
        elasticSearchLoading: true,
        selectedSavedSearch: action.newSavedSearch
      };

    /**
     * Successfully retrieved data from the search results. Loading and errors will be cleared
     * at this point.
     */
    case "SUCCESS_TABLE_DATA":
      return {
        ...state,
        error: undefined,
        elasticSearchLoading: false,
        searchResults: action.searchResults,
        totalRecords: action.newTotal,
        performElasticSearchRequest: false
      };

    /**
     * An error has occurred. Display an error message on the page.
     */
    case "ERROR":
      return {
        ...state,
        searchResults: [],
        totalRecords: 0,
        error: action.errorLabel,
        performElasticSearchRequest: false,
        performIndexRequest: false,
        reloadUserPreferences: false,
        elasticSearchLoading: false,
        indexLoading: false,
        userPreferenceLoading: false
      };

    default:
      throw new Error("Action type not supported: " + action);
  }
}
