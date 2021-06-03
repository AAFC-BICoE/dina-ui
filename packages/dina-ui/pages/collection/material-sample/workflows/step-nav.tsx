import React from "react";

export default function StepNav(props) {
  const dots: any = [];
  for (let i = 1; i <= props.totalSteps; i += 1) {
    const isActive = props.currentStep === i;
    dots.push(
      (
        <span
          key={`step-${i}`}
          className={`dot ${isActive ? "active" : ""}`}
          onClick={() => props.goToStep(i)}
        >
          {" "}
          &bull;
        </span>
      ) as any
    );
  }
  return <div className="nav">{dots}</div>;
}
