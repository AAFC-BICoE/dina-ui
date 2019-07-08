import React from "react";
import Link from "next/link";

interface CreateButtonProps {
    entityLabel: string,
    entityLink: string
}

/**
 * Create Button which is commonly used in the button bar.
 * 
 * @param {string} entityLabel  The label added for the buttons text. Gets appended with "Create " + entityLabel.
 * @param {string} entityLink   The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/".
 */
export function CreateButton(props: CreateButtonProps) {
    return (
        <Link href={`/${props.entityLink}/edit`} prefetch={true}>
            <button className="btn btn-primary">Create {props.entityLabel}</button>
        </Link>
    );
}
