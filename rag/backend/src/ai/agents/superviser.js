import { z } from "zod";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { llm } from "../model/llm.js";

import { Command } from "@langchain/langgraph";

const model = llm;

const prompt = ChatPromptTemplate.fromTemplate(`
    `);

const SupervisorSchema = z.object({
//   next_agent: z.enum(["research", "writer", "__end__"]),
//   feedback: z.string(),
});

export const supervisor = async (state) => {
  console.log("supervisor");
  // console.log(state);

  const structuredModel = model.withStructuredOutput(SupervisorSchema);
  const modelWithPrompt = prompt.pipe(structuredModel);
  const response = await modelWithPrompt.invoke({
    // topic: state.topic,
    // subTopic: state.subTopic,
    // lastAgent: state.lastAgent,
    // lastContent: state.lastContent,
    
  });

  // console.log(response);

  return new Command({
    // goto: response.next_agent,
    // update: { feedback: response.feedback },
  });
};
