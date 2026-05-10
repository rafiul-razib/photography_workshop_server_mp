require("dotenv").config();

const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { port, CORS_ORIGINS } = require("./config/constants");

const app = express();

app.use(
  cors({
    origin: CORS_ORIGINS,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

app.get("/", (req, res) => {
  res.send("Workshop Server is Running!!");
});

app.listen(port, () => {
  console.log(`Workshop running on port: ${port}`);
});
