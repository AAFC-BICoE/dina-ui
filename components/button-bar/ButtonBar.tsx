import React from "react";
import "./buttonbar.css";

export function ButtonBar(props: { children: React.ReactNode; }) {
    return (
        <div className="button-bar">
            {props.children}
        </div>
    );
}
