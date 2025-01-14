import { InstanceContext, InstanceContextI } from "../InstanceContextProvider";

import { render } from "@testing-library/react";
import { useInstanceContext } from "../useInstanceContext";
import "@testing-library/jest-dom";
import { ReactNode } from "react";

function MockInstanceContextProvider({ children }: { children: ReactNode }) {
  const instanceJson: InstanceContextI = {
    supportedLanguages: "en,fr",
    instanceMode: "developer",
    instanceName: "",
    supportedGeographicReferences: ""
  };

  return (
    <InstanceContext.Provider value={instanceJson}>
      {children}
    </InstanceContext.Provider>
  );
}

describe("InstanceContextProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("useInstanceContext", async () => {
    // get instance context
    const DumyComponent = () => {
      const instanceContext = useInstanceContext();
      return (
        <>
          <p data-testid="supportedLanguages">
            {instanceContext?.supportedLanguages}
          </p>
          <p data-testid="instanceMode">{instanceContext?.instanceMode}</p>
        </>
      );
    };

    const component = render(
      <MockInstanceContextProvider>
        <DumyComponent />
      </MockInstanceContextProvider>
    );

    const p1 = await component.findByTestId("supportedLanguages");
    expect(p1).toBeInTheDocument();
    expect(p1.textContent).toBe("en,fr");
    const p2 = await component.findByTestId("instanceMode");
    expect(p2).toBeInTheDocument();
    expect(p2.textContent).toBe("developer");
  });
});
