import bodyparser from "body-parser";
import express, { Request, Response } from "express";
import { FB } from ".";

const app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

FB.init(app, {
  loginScopes: FB._pageScopes,
  callbackHandler: async (req: Request, res: Response) => {
    const pages = await FB.getUserPages(req);
    res.send(pages);
  },
  webhookHandler: async (req: Request, res: Response) => {
    const messages = await FB.getIncomingMessage(req);
    // Handle incoming messages here if needed
  },
});

app.use((req: Request, res: Response) => {
  res.status(404).send("Not found ehhe");
});

app.listen(5555, (err?: any) => {
  console.clear();
  console.log("Running", "http://localhost:5555/auth/fb");
});
