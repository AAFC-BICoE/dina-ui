import React from "react";
import Link from "next/link";

/**
 * Create Button which is commonly used in the button bar.
 * 
 * @param {string} entityLabel  The label added for the buttons text. Gets appended with "Create " + entityLabel.
 * @param {string} entityLink   The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/".
 */
export function CreateButton(entityLabel: string, entityLink: string) {
    return (
        <Link href={`/${entityLink}/edit`} prefetch={true}>
            <button className="btn btn-primary">Create ${entityLabel}</button>
        </Link>
    );
}
