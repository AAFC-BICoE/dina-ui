import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import { ApiClientProvider } from "../../api-client/ApiClientContext";
import { DefaultInstanceContextProvider } from "../InstanceContextProvider";
import { useInstanceContext } from "../useInstanceContext";

describe("InstanceContextProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("render InstanceContextProvider", async () => {
    const apiContext: any = {
      apiClient: {
        get: jest.fn().mockResolvedValue({
          "supported-languages-iso": "lang1, lang2",
          "instance-mode": "mode1"
        })
      }
    };
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
      <ApiClientProvider value={apiContext}>
        <DefaultInstanceContextProvider>
          <DumyComponent />
        </DefaultInstanceContextProvider>
      </ApiClientProvider>
    );

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledTimes(1)
    );
    const p1 = await component.findByTestId("supportedLanguages");
    expect(p1).toBeInTheDocument();
    expect(p1.textContent).toBe("lang1, lang2");
    const p2 = await component.findByTestId("instanceMode");
    expect(p2).toBeInTheDocument();
    expect(p2.textContent).toBe("mode1");
  });
});
