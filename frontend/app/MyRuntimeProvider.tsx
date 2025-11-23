"use client";

import {
  AssistantRuntimeProvider,
  AssistantTransportConnectionMetadata,
  unstable_createMessageConverter as createMessageConverter,
  useAssistantTransportRuntime,
} from "@assistant-ui/react";
import {
  convertLangChainMessages,
  LangChainMessage,
} from "@assistant-ui/react-langgraph";
import React, { ReactNode } from "react";

// Note: WeatherTool is now executed on the backend.
// The frontend only displays the result using WeatherToolUI component.
// This frontend tool definition is kept for reference but not used.
// const WeatherTool = makeAssistantTool({ ... });

type MyRuntimeProviderProps = {
  children: ReactNode;
};

type State = {
  messages: LangChainMessage[];
};

const LangChainMessageConverter = createMessageConverter(
  convertLangChainMessages,
);

const converter = (
  state: State,
  connectionMetadata: AssistantTransportConnectionMetadata,
) => {
  const optimisticStateMessages = connectionMetadata.pendingCommands.map(
    (c): LangChainMessage[] => {
      if (c.type === "add-message") {
        return [
          {
            type: "human" as const,
            content: [
              {
                type: "text" as const,
                text: c.message.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("\n"),
              },
            ],
          },
        ];
      }
      return [];
    },
  );

  const messages = [...state.messages, ...optimisticStateMessages.flat()];
  console.log({ state, messages });
  return {
    messages: LangChainMessageConverter.toThreadMessages(messages),
    isRunning: connectionMetadata.isSending || false,
  };
};

export function MyRuntimeProvider({ children }: MyRuntimeProviderProps) {
  const runtime = useAssistantTransportRuntime({
    initialState: {
      messages: [],
    },
    api:
      process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8010/assistant",
    converter,
    headers: async () => ({
      "Test-Header": "test-value",
    }),
    body: {
      "Test-Body": "test-value",
    },
    onResponse: () => {
      console.log("Response received from server");
    },
    onFinish: () => {
      console.log("Conversation completed");
    },
    onError: (error: Error) => {
      console.error("Assistant transport error:", error);
    },
    onCancel: () => {
      console.log("Request cancelled");
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
