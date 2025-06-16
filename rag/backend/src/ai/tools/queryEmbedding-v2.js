import { embeddings } from "../model/embedding.js";
import { tool } from "@langchain/core/tools";
import logger from "./logger.js";
import { Client } from "pg";
import { z } from "zod";

const pgClient = new Client({
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  ssl: {
    rejectUnauthorized: false,
  },
});
await pgClient.connect();

const getProductInfo_v2Schema = z.object({
  input: z.string().describe("The user's product query input."),
  topK: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe("Number of top similar results to return. Default is 5."),
});
export const getProductInfo_v2 = tool(
  async ({ input, topK = 5 }) => {
    try {
      console.log("use tool");
      console.log(input);

      const queryEmbeddingRaw = await embeddings.embedQuery(input);
      const queryEmbedding = Array.isArray(queryEmbeddingRaw)
        ? queryEmbeddingRaw
        : Array.from(queryEmbeddingRaw);
      const queryEmbeddingString = JSON.stringify(queryEmbedding);

      const { rows } = await pgClient.query(
        `
        SELECT  "content", (embedding <-> $1::vector) AS similarity_score
        FROM public.library_chunks
        WHERE library_id = $2
        ORDER BY similarity_score asc
        LIMIT $3 
        `,
        [queryEmbeddingString, 391, topK]
      );

      const documents = rows
        .map(
          (row) => row.content + `\nsimilarity_score ${row.similarity_score}`
        )
        .join("\n\n");

      console.log(documents);

      return documents;
    } catch (err) {
      console.log("err");
      logger.error("Error during semantic search", err);
      return [];
    }
  },
  {
    name: "searchProductAndService",
    description:
      "Performs a semantic product & service search using embedding vectors based on the user's input query.",
    schema: getProductInfo_v2Schema,
  }
);
