import React from "react";
import Link from "next/link";

interface CancelButtonProps {
    entityId: string,
    entityLink: string
}

/**
 * Create Button which is commonly used in the button bar.
 * 
 * @param {string} entityLink   The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/".
 * @param {string} entityId     If the id is set, it will return to the view. If it's not, it will return to the list.
 */
export const CancelButton = function(props: CancelButtonProps) {
    if (props.entityId) {
        return (
            <Link href={`/${props.entityLink}/view?id=${props.entityId}`} prefetch={true}>
                <button className="btn btn-outline-secondary">Cancel</button>
            </Link>
        );
    } else {
        return (
            <Link href={`/${props.entityLink}/list`} prefetch={true}>
                <button className="btn btn-outline-secondary">Cancel</button>
            </Link>
        );        
    }

}
