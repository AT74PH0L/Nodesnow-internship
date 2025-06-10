import { AzureOpenAIEmbeddings } from "@langchain/openai";
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";

export const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_EMBEDDINGS_KEY, // In Node.js defaults to
  azureOpenAIApiInstanceName:
    process.env.AZURE_OPENAI_API_EMBEDDINGS_INSTANCE_NAME, // In Node.js defaults to process.env.AZURE_OPENAI_API_INSTANCE_NAME
  azureOpenAIApiEmbeddingsDeploymentName:
    process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME, // In Node.js defaults to process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_EMBEDDINGS_VERSION, // In Node.js defaults to process.env.AZURE_OPENAI_API_VERSION
  maxRetries: 1,
});

