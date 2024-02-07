import { render } from "@testing-library/react";
import { ApiClientProvider } from "../../api-client/ApiClientContext";
import { InstanceProvider } from "../InstanceProvider";
import { useInstance } from "../useInstance";
import "@testing-library/jest-dom";

describe("InstanceProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("use InstanceContext", async () => {
    const apiContext: any = {
      apiClient: {
        axios: {
          get: jest.fn().mockResolvedValue({data: {
            "supported-languages-iso": "lang1, lang2",
            "instance-mode": "mode1"
          }})
        }
      }
    };
    // get instance context
    const DumyComponent = () => {
      const instanceContext = useInstance();
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
        <InstanceProvider>
          <DumyComponent />
        </InstanceProvider>
      </ApiClientProvider>
    );

    expect(apiContext.apiClient.axios.get).toHaveBeenCalledTimes(1);
    const p1 = await component.findByTestId("supportedLanguages");
    expect(p1).toBeInTheDocument();
    expect(p1.textContent).toBe("lang1, lang2");
    const p2 = await component.findByTestId("instanceMode");
    expect(p2).toBeInTheDocument();
    expect(p2.textContent).toBe("mode1");
  });
});
