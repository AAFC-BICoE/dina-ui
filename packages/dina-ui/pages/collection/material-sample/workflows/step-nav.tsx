import React from "react";

export default function StepNav(props) {
  const dots: any = [];
  for (let i = 1; i <= props.totalSteps; i += 1) {
    const isActive = props.currentStep === i;
    dots.push(
      (
        <span key={`step-${i}`}>
          <span className="d-flex align-items-start flex-column">
            <span
              className={`dot ${isActive ? "active" : ""}`}
              onClick={() => props.goToStep(i)}
            >
              &bull;
            </span>
            <span>{"Step " + i}</span>
          </span>
          <span className="mb-auto p-4" />
        </span>
      ) as any
    );
  }
  return <div className="d-flex justify-content-center">{dots}</div>;
}
