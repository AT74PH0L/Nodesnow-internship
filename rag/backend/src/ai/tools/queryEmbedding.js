import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { embeddings } from "../model/embedding.js";
import { tool } from "@langchain/core/tools";
import logger from "./logger.js";
import { Client } from "pg";

const config = {
  postgresConnectionOptions: {
    type: "postgres",
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    ssl: {
      rejectUnauthorized: false,
    },
  },
  tableName: "library_chunks",
  columns: {
    idColumnName: "id",
    vectorColumnName: "embedding",
    contentColumnName: "content",
    metadataColumnName: "json_content",
  },
  // supported distance strategies: cosine (default), innerProduct, or euclidean
  distanceStrategy: "cosine",
};

export const getProductInfo = tool(
  async (input) => {
    logger.info("Tool called", { input });

    try {
      const vectorStore = await PGVectorStore.initialize(embeddings, config);
      const res = await vectorStore.similaritySearchWithScore(input, 10);
      console.log(res);
      const docsContent = res.map((doc) => doc.pageContent).join("\n");

      console.log(docsContent);
      return docsContent;
    } catch (error) {
      logger.error("Failed to fetch product info", {
        input,
        error: error.message,
        stack: error.stack,
      });

      return JSON.stringify({
        content:
          "ขออภัย ระบบไม่สามารถค้นหาข้อมูลสินค้าได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
      });
    }
  },
  {
    name: "searchProduct",
    description:
      "Performs a semantic product search using embedding vectors based on the user's input query.",
  }
);
