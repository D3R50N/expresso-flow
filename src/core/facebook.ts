import { Express } from 'express-serve-static-core';
// src/services/Facebook.ts
import axios from "axios";
import { Request, Response } from "express";
import config from "../config";
import ExpressoFlow from "../index";
import Router from "../lib/router";
import { appUrl, debug, safeValue } from "../lib/utils";

interface FacebookOptions {
  appId?: string;
  appSecret?: string;
  webhookVerify?: string;
  loginScopes?: string[];
  callbackUrl?: string;
  loginUrl?: string;
  webhookUrl?: string;
  callbackHandler?: (req: Request, res: Response) => void;
  webhookHandler?: (req: Request, res: Response) => void;
}

interface MessagePayload {
  text?: string;
  attachment?: object;
  quick_replies?: object[];
}

class Facebook {
  private static appId: string | null;
  private static appSecret: string | null;
  private static webhookVerify: string | null;

  public static _scopes = {
    email: "email",
    publicProfile: "public_profile",
    pagesShowList: "pages_show_list",
    pagesReadEngagement: "pages_read_engagement",
    pagesManageMetadata: "pages_manage_metadata",
    pagesMessaging: "pages_messaging",
    pagesManageEngagement: "pages_manage_engagement",
    businessManagement: "business_management",
    pagesReadUserContent: "pages_read_user_content",
    pagesManagePosts: "pages_manage_posts",
  };
  public static _pageScopes: string[] = [
    this._scopes.pagesManageMetadata,
    this._scopes.pagesMessaging,
    this._scopes.pagesReadEngagement,
  ];
  private static loginScopes: string[] = [
    this._scopes.email,
    this._scopes.publicProfile,
  ];
  private static paths = {
    callback: "/auth/fb/callback",
    login: "/auth/fb",
    webhook: "/auth/fb/webhook",
  };

  private static keys = {
    userAccessToken: "fb.user_access_token",
    incomingEntries: "fb.incoming_entries",
  };

  public static init(app: Express, options: FacebookOptions = {}) {
    this.appId = safeValue(options.appId, config.FACEBOOK_APP_ID);
    this.appSecret = safeValue(options.appSecret, config.FACEBOOK_APP_SECRET);
    this.webhookVerify = safeValue(
      options.webhookVerify,
      config.FACEBOOK_WEBHOOK_VERIFY
    );
    this.loginScopes = safeValue(options.loginScopes, this.loginScopes) ?? [];
    this.paths.login = safeValue(options.loginUrl, this.paths.login)!;
    this.paths.callback = safeValue(options.callbackUrl, this.paths.callback)!;
    this.paths.webhook = safeValue(options.webhookUrl, this.paths.webhook)!;

    app.use(this.middleware(options));
  }

  private static redirectUri(req: Request): string {
    return `${appUrl(req)}${this.paths.callback}`;
  }

  private static async handleError<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (error: any) {
      debug.error("Facebook API error", error.response?.data || error.message);
      return null;
    }
  }

  public static retrieveShortToken(code: string, redirect_uri: string) {
    return this.handleError(async () => {
      const res = await axios.get(
        "https://graph.facebook.com/oauth/access_token",
        {
          params: {
            client_id: this.appId,
            redirect_uri,
            client_secret: this.appSecret,
            code,
          },
        }
      );
      return res.data.access_token;
    });
  }

  public static retrieveLongToken(shortToken: string) {
    return this.handleError(async () => {
      const res = await axios.get(
        "https://graph.facebook.com/oauth/access_token",
        {
          params: {
            grant_type: "fb_exchange_token",
            client_id: this.appId,
            client_secret: this.appSecret,
            fb_exchange_token: shortToken,
          },
        }
      );
      return res.data.access_token;
    });
  }

  public static retrieveUserPages(accessToken: string) {
    return this.handleError(async () => {
      const res = await axios.get("https://graph.facebook.com/me/accounts", {
        params: { access_token: accessToken },
      });
      return res.data.data;
    });
  }

  public static subscribeToWebhook(pageId: string, pageToken: string) {
    return this.handleError(async () => {
      const res = await axios.post(
        `https://graph.facebook.com/${pageId}/subscribed_apps`,
        null,
        {
          params: {
            access_token: pageToken,
            subscribed_fields: "messages,messaging_postbacks",
          },
        }
      );
      return res.data.success;
    });
  }

  public static unsubscribeFromWebhook(pageId: string, pageToken: string) {
    return this.handleError(async () => {
      const res = await axios.delete(
        `https://graph.facebook.com/${pageId}/subscribed_apps`,
        {
          params: { access_token: pageToken },
        }
      );
      return res.data.success;
    });
  }

  public static sendMessage(
    token: string,
    recipientId: string,
    payload: MessagePayload
  ) {
    return this.handleError(async () => {
      const res = await axios.post(
        "https://graph.facebook.com/me/messages",
        {
          recipient: { id: recipientId },
          message: payload,
        },
        {
          params: { access_token: token },
        }
      );
      return res.data;
    });
  }

  public static getUserAccessToken(req: Request) {
    return ExpressoFlow.of(req).getLocal(this.keys.userAccessToken);
  }

  public static getIncomingMessage(req: Request) {
    return ExpressoFlow.of(req).getLocal(this.keys.incomingEntries);
  }

  public static getUserPages(req: Request) {
    const accessToken = this.getUserAccessToken(req);
    return this.retrieveUserPages(accessToken);
  }

  private static middleware(options: FacebookOptions) {
    const router = Router();

    router.get(this.paths.callback, async (req: Request, res: Response) => {
      const { code } = req.query as { code: string };
      const shortToken = await this.retrieveShortToken(
        code,
        this.redirectUri(req)
      );
      const longToken = shortToken
        ? await this.retrieveLongToken(shortToken)
        : null;

      if (longToken) {
        ExpressoFlow.of(req, res).setLocal(
          this.keys.userAccessToken,
          longToken
        );
      }

      const handler =
        options.callbackHandler || ((_, res) => res.send("Success"));
      handler(req, res);
    });

    router.get(this.paths.login, (req: Request, res: Response) => {
      const url = `https://www.facebook.com/dialog/oauth?client_id=${
        this.appId
      }&redirect_uri=${this.redirectUri(req)}&scope=${this.loginScopes.join(
        ","
      )}&response_type=code`;
      res.redirect(url);
    });

    router.get(this.paths.webhook, (req: Request, res: Response) => {
      const mode = req.query["hub.mode"];
      const challenge = req.query["hub.challenge"];
      const token = req.query["hub.verify_token"];

      if (mode === "subscribe" && token === this.webhookVerify) {
        res.send(challenge);
        return;
      }
      res.status(400).send("No");
    });

    router.post(this.paths.webhook, (req: Request, res: Response) => {
      ExpressoFlow.of(req, res).setLocal(
        this.keys.incomingEntries,
        req.body.entry
      );
      const handler =
        options.webhookHandler || ((_, res) => res.send("Success"));
      handler(req, res);
    });

    return router;
  }
}

export default Facebook;
