import React from "react";

interface CreateButtonProps {
    //The label added for the buttons text. Gets appended with "Create " + entityLabel.
    entityLabel: string,

    // The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/".
    entityLink: string
}

/**
 * Create Button which is commonly used in the button bar.
 */
export function CreateButton(props: CreateButtonProps) {
    return (
        <a href={`/${props.entityLink}/edit`} className="btn btn-primary">Create {props.entityLabel}</a>
    );
}
