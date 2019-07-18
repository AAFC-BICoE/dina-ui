import React from "react";

interface EditButtonProps {
    // The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/".
    entityLink: string,

    // The id of the entity to edit.
    entityId: string
}

/**
 * Edit Button which is commonly used in the button bar.  
 */
export function EditButton(props: EditButtonProps) {
    return (
        <a href={`/${props.entityLink}/edit?id=${props.entityId}`} className="btn btn-primary">Edit</a>
    );
}
