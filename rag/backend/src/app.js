import express from "express";
import "dotenv/config";
import { assistant } from "./ai/agents/assistant.js";
// import { sequelize } from "./db/db.js";
import cors from "cors";
// import { pool } from "./db/db.js";
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 3000;

app.post("/", async (req, res) => {
  console.log(req.body.history);
  // console.log(req.body.message);
  const output = await assistant(req.body.history, req.body.message);
  res.send(output);
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
