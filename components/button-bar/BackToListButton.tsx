import React from "react";
import Link from "next/link";

interface BackToListButtonProps {
    entityLink: string
}

/**
 * Back to List Button which is commonly used in the button bar.
 * 
 * @param {string} entityLink   The link type for where to redirect the user. Gets appended with "/" + entityLink + "/list/".
 */
export const BackToListButton = function(props: BackToListButtonProps) {
    return (
        <Link href={`/${props.entityLink}/list`} prefetch={true}>
            <button className="btn btn-outline-secondary">Back to List</button>
        </Link>
    );
}
