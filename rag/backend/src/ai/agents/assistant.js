import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { getProductInfo } from "../tools/queryEmbedding.js";
import { getProductInfo_v2 } from "../tools/queryEmbedding-v2.js";
import { llm } from "../model/llm.js";

export async function assistant(historyMessages, currentInput) {
  const TextResponseSchema = z.object({
    content: z.string(),
  });

  const ProductResponseSchema = z.object({
    products: z
      .array(
        z.object({
          id: z.string().describe("The unique identifier of the product."),
          name: z.string().describe("The name of the product."),
          benefits: z
            .array(z.string())
            .describe("A list of key benefits or features."),
          pain_points_solved: z
            .array(z.string())
            .describe("Problems or pain points the product addresses."),
          pricing: z
            .string()
            .describe(
              "The price or pricing model, e.g. '฿2,500' or 'Contact for price'."
            ),
          target_audience: z
            .array(z.string())
            .describe("Groups of people the product is intended for."),
          similarity_score: z
            .number()
            .describe("Similarity score between 0 and 1."),
        })
      )
      .describe("List of product objects matching the query."),
    query_used: z.string().describe("Query string used in the search."),
  });

  const ResponseSchema = z.union([TextResponseSchema, ProductResponseSchema]);
  const parser = StructuredOutputParser.fromZodSchema(ResponseSchema);

  const systemMessage = new SystemMessage(`
    You are an intelligent assistant helping users with both general inquiries and queries related to products and services.

    You have access to a product & service search tool. Use this tool ONLY when the user's query is specifically about **product or service information**, such as:
    - Searching for specific products or services
    - Comparing multiple products or services
    - Requesting features, benefits, or pricing
    - Asking for product or service recommendations


    Examples:
    "What are the benefits of Product A?"
    "Compare Product A and Product B"
    "How much does Service X cost?"
    "Recommend me a software for accounting"

    IF TOOL RETURNS EMPTY, return:
    {
      "products": [],
      "query_used": "<the query you used>"
    }

    For all other general or non-product/service questions (e.g., history, opinions, casual conversation), respond directly with:

    {
      "content": "<your message>"
    }

    You must respond in **JSON format only**:

    - For general responses:
      { "content": "<your message>" }

    - For product/service-related queries (only when tool is used):
      {
        "products": [
          {
            "id": "string",
            "name": "string",
            "benefits": ["string", ...],
            "pain_points_solved": ["string", ...],
            "pricing": "string",
            "target_audience": ["string", ...],
            "similarity_score": number (0 to 1)
          },
          ...
        ],
        "query_used": "string"
      }

    Do not return plain text. Think carefully before deciding whether to use the tool.

    Format Instructions:
    ${parser.getFormatInstructions()}
`);

  const messages = [
    systemMessage,
    ...historyMessages,
    new HumanMessage(currentInput),
  ];

  const agent = createReactAgent({
    llm,
    tools: [getProductInfo_v2],
  });

  const response = await agent.invoke({ messages });
  const lastMessage = response.messages.at(-1)?.content;
  let parsed;
  try {
    parsed = await parser.parse(lastMessage);
    // console.log(parsed);
  } catch (err) {
    console.error("❌ JSON Parse Error:", err, "Raw message:", lastMessage);
    parsed = { content: lastMessage };
  }
  return parsed;
}
