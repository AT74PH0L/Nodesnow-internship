import {
  StateGraph,
  MessagesAnnotation,
  Command,
  Annotation,
} from "@langchain/langgraph";
import { supervisor } from "./agents/superviser.js";
import { research } from "./agents/research.js";
import { writer } from "./agents/writer.js";
import { outlineProcess } from "./agents/outline.js";
import fs from "fs";
import dayjs from "dayjs";

const GraphState = Annotation.Root({
  //   topic: Annotation,
  //   subTopic: Annotation,
  //   lastContent: Annotation,
  //   lastAgent: Annotation,
  //   feedback: Annotation,
  //   researchContent: Annotation,
  // historyMessages: Annotation({
  //   //Array of message
  //   reducer: (x, y) => x.concat(y),
  //   default: () => [],
  // }),
});

const graph = new StateGraph(GraphState)
  .addNode("supervisor", supervisor, {
    ends: ["research", "writer", "__end__"],
  })

  .addEdge("__start__", "supervisor")
  .compile();

const INPUT = "AI";

const result = await graph.invoke(
  {
    topic: INPUT,
    subTopic: sub,
  },
  {
    // recursionLimit: 5,
  }
);

// console.log(result.lastContent);
