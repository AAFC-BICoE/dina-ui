import React from "react";
import "./buttonbar.css";

export const ButtonBar = function(props: { children: React.ReactNode; }) {
    return (
        <div className="button-bar">
            {props.children}
        </div>
    );
}
