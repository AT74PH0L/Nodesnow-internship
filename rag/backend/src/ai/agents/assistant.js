import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { getProductInfo } from "../tools/queryEmbedding.js";
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
    You are an intelligent assistant helping users with both general inquiries and product-related questions.

    You have access to a product search tool. Use the tool ONLY when the user’s query is about product information such as:
    - Searching for specific products
    - Comparing products
    - Requesting product features, benefits, or pricing
    - Asking for product recommendations

    DO NOT use the tool for general questions, chit-chat, greetings, or any inquiry not related to products.

    Respond in **JSON format only**:

    - For general answers or casual conversation:
      { "content": "<your message>" }

    - For product-related queries (only if tool is used):
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

    Only respond in one of the two JSON formats above. Never reply with plain text. Think carefully before deciding whether to use the tool.

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
    tools: [getProductInfo],
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
