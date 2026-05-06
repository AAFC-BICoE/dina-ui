import { createContext, useContext, useState } from "react";

type MessageContextType = {
  message: string;
  setMessage: (value: string) => void;
};

const MessageContext = createContext<MessageContextType>({
  message: "",
  setMessage: () => {}
});

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");

  return (
    <MessageContext.Provider value={{ message, setMessage }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessage() {
  return useContext(MessageContext);
}
