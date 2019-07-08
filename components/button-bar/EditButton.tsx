import React from "react";
import Link from "next/link";

interface EditButtonProps {
    entityLink: string,
    entityId: string
}

/**
 * Edit Button which is commonly used in the button bar.
 * 
 * @param {string} entityLink   The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/".
 * @param {string} entityId     The id of the entity to edit.
 */
export function EditButton(props: EditButtonProps) {
    return (
        <Link href={`/${props.entityLink}/edit?id=${props.entityId}`} prefetch={true}>
            <button className="btn btn-primary">Edit</button>
        </Link>
    );
}
