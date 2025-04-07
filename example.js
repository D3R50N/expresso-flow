const axios = require("axios");
const express = require("express");
const bodyparser = require("body-parser");
const { FB } = require("./lib/type");

const app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

FB.init(app, {
  loginScopes: FB._page_scopes,
  callbackHandler: async (req, res) => {
    const pages = await FB.getUserPages(req);
    res.send(pages);
  },
  webhookHandler: async (req, res) => {
    const messages = await FB.getIncomingMessage(req);
  },
});

app.use((req, res) => {
  res.status(404).send("Not found ehhe");
});

app.listen(5555, (err) => {
  console.clear();
  console.log("Running", "http://localhost:5555/auth/fb");
});
