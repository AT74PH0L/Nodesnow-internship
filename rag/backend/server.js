import "dotenv/config";
import express from "express";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  console.log("hello world!");
});

app.listen(port, () => {
  console.log(`Server running at <http://localhost>:${port}/`);
});
