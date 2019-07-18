import React from "react";

interface CancelButtonProps {
    // If the id is set, it will return to the view. If it's not, it will return to the list.
    entityId: string,

    // The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/".
    entityLink: string
}

/**
 * Create Button which is commonly used in the button bar.
 */
export function CancelButton(props: CancelButtonProps) {
    if (props.entityId) {
        return (
            <a href={`/${props.entityLink}/view?id=${props.entityId}`} className="btn btn-outline-secondary">Cancel</a>
        );
    } else {
        return (
            <a href={`/${props.entityLink}/list`} className="btn btn-outline-secondary">Cancel</a>
        );        
    }

}
