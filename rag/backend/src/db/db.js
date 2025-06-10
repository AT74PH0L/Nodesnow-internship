// config/database.js
// import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

import { Sequelize } from "@sequelize/core";
import { PostgresDialect } from "@sequelize/postgres";

export const sequelize = new Sequelize({
  dialect: PostgresDialect,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port:  process.env.DB_PORT,
  ssl: true,
  clientMinMessages: "notice",
});
