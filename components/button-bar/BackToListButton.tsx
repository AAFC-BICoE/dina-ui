import React from "react";

interface BackToListButtonProps {
    // The link type for where to redirect the user. Gets appended with "/" + entityLink + "/list/".
    entityLink: string
}

/**
 * Back to List Button which is commonly used in the button bar.
 */
export function BackToListButton(props: BackToListButtonProps) {
    return (
        <a href={`/${props.entityLink}/list`} className="btn btn-outline-secondary">Back to List</a>
    );
}
