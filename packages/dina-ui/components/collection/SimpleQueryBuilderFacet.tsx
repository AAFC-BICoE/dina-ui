import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Utils } from "@react-awesome-query-builder/ui";
import _ from "lodash";
import { defaultQueryTree } from "packages/common-ui/lib";
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';

export interface SimpleQueryBuilderFacetProps {
    
    /**
     * Data to populate filter builder options
     */
    data?: any;

    /**
     * current tree state
     */
    queryBuilderTree: any;

    /**
     * handles filter updates
     */
    onFilterChange: any;
}

const SimpleQueryBuilderFacet = forwardRef((
    {
        data,
        queryBuilderTree,
        onFilterChange
    }: SimpleQueryBuilderFacetProps,
    ref
) => {

    // Ref for handling query builder reset
    useImperativeHandle(ref, () => ({
        resetFacet: () => {
            setTreeState({});
            ruleIdMap.current = {};
            onFilterChange(defaultQueryTree());
        },
    }));

    // For tracking querybuildertree rules
    const ruleIdMap = useRef({});

    // State: track which fields are expanded, and which values are checked per field
    // {
    //   [field]: {
    //     expanded: boolean,
    //     checked: array of value strings,
    //   }
    // }
    const [treeState, setTreeState] = useState({});

    // Expand/collapse field
    function toggleField(field) {
        setTreeState((prev) => ({
            ...prev,
            [field]: {
                ...prev[field],
                expanded: !prev[field]?.expanded,
                checked: prev[field]?.checked || [],
            },
        }));
    }

    // Toggle checkbox for a value in a field
    function toggleCheckbox(field, value) {
        setTreeState((prev) => {
            const oldChecked = prev[field]?.checked || [];
            let newChecked;
            if (oldChecked.includes(value)) {
                newChecked = oldChecked.filter((v) => v !== value);
            } else {
                newChecked = [...oldChecked, value];
            }
            return {
                ...prev,
                [field]: {
                    expanded: prev[field]?.expanded ?? true,
                    checked: newChecked,
                },
                recentChanged: field
            };
        });
    }

    useEffect(() => {
        if (!treeState['recentChanged']) {
            return;
        }
        const field = treeState['recentChanged'];
        const checked = treeState[field]?.checked || [];
        updateFacetQuery({ field, checked });
    }, [treeState]);

    // (Alternatively, useEffect on treeState to keep query in sync)

    // Display if checked even if not expanded
    function getChecked(field) {
        return treeState[field]?.checked || [];
    }

    // Main query tree update logic (for this field)
    function updateFacetQuery({ field, checked }) {

        const jsonTree = _.cloneDeep(Utils.getTree(queryBuilderTree));

        // if rule does not exist and at least one box is checked for that field.
        if (!(field in ruleIdMap.current) && checked.length > 0) {
            ruleIdMap.current[field] = Utils.uuid()


            const newRule = {
                id: ruleIdMap.current[field],
                type: "rule",
                properties: {
                    field: `data.attributes.${field}`,
                    operator: "in",
                    value: [checked.join(",")],
                    valueSrc: [],
                    valueType: [],
                    valueError: [],
                    fieldError: undefined,
                    fieldSrc: "field"
                }
            }

            if (!jsonTree.children1) {
                jsonTree.children1 = [newRule as any];
            } else {
                jsonTree.children1 = [...jsonTree.children1, newRule] as any;
            }

            // if field has no boxes checked and rule exists
        } else if (checked.length === 0 && (field in ruleIdMap.current)) {
            if (jsonTree.children1) {

                jsonTree.children1 = jsonTree.children1.filter((child) => {
                    if (!child?.id) {
                        return true;
                    }
                    return child.id !== ruleIdMap.current[field]
                }) as any;
                delete ruleIdMap.current[field];
            }
        } else if ((field in ruleIdMap.current)) {

            const ruleIndex = jsonTree.children1?.findIndex((child) => {
                if (!child?.id) {
                    return false;
                }
                return child.id === ruleIdMap.current[field]
            });

            if (ruleIndex !== undefined && ruleIndex >= 0 && jsonTree.children1) {
                (jsonTree.children1[ruleIndex].properties as any).value = [checked.join(",")];
            }
        } else {
            // if no checked boxes for that field and rule doesnt exist do nothing.
            return
        }


        const newTree = Utils.loadTree(jsonTree);




        onFilterChange(newTree);
    }

    const [filterConjunction, setFilterConjunction] = useState(
        "AND"
    )

    useEffect(() => {
        const jsonTree = _.cloneDeep(Utils.getTree(queryBuilderTree));

        if (jsonTree.properties) {
            jsonTree.properties["conjunction"] = filterConjunction;
        }

        const newTree = Utils.loadTree(jsonTree);

        onFilterChange(newTree);
    }, [filterConjunction])

    return (

        <div className="ms-4 mt-1">
            <ToggleButtonGroup type="radio" name="filterConjunctionSwitch" value={filterConjunction} onChange={setFilterConjunction}>
                <ToggleButton id="filterConjunctionSwitch-1" value={'AND'}>AND</ToggleButton>
                <ToggleButton id="filterConjunctionSwitch-2" value={'OR'}>OR</ToggleButton>
            </ToggleButtonGroup>
            {Object.keys(data).map((field) => {
                const fieldData = data[field];
                const expanded = treeState[field]?.expanded || false;
                const checked = getChecked(field);

                return (
                    <div key={field} className="mb-3">
                        {/* Parent node "row" */}
                        <div
                            style={{ cursor: "pointer", fontWeight: "bold", userSelect: "none" }}
                            onClick={() => toggleField(field)}
                        >
                            <span>{expanded ? "<" : ">"}</span> {field}
                            {/* Show checked values count if any */}
                            {checked.length > 0 && (
                                <span className="ms-2 badge bg-primary">
                                    {checked.length} selected
                                </span>
                            )}
                        </div>
                        {/* If expanded, show all options. If not, show only checked. */}
                        <div style={{ marginLeft: 24 }}>
                            {expanded
                                ? Object.keys(fieldData).map((value) => (
                                    <div
                                        key={value}
                                        className="d-flex align-items-center py-1"
                                    >
                                        <input
                                            id={`checkbox-${field}-${value}`}
                                            type="checkbox"
                                            checked={checked.includes(value)}
                                            onChange={() => toggleCheckbox(field, value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <label
                                            htmlFor={`checkbox-${field}-${value}`}
                                            className="ms-2 mb-0"
                                            style={{ cursor: "pointer" }}
                                        >
                                            {value}
                                        </label>
                                        <span className="badge bg-light text-secondary ms-2">
                                            {fieldData[value]}
                                        </span>
                                    </div>
                                ))
                                : // collapsed: only show checked boxes as summary
                                checked.length > 0 &&
                                checked.map((value) => (
                                    <div
                                        key={value}
                                        className="d-flex align-items-center py-1"
                                    >
                                        <input
                                            id={`checkbox-${field}-${value}`}
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => toggleCheckbox(field, value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <label
                                            htmlFor={`checkbox-${field}-${value}`}
                                            className="ms-2 mb-0"
                                            style={{ cursor: "pointer" }}
                                        >
                                            {value}
                                        </label>
                                        <span className="badge bg-light text-secondary ms-2">
                                            {fieldData[value]}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
})

export default SimpleQueryBuilderFacet;