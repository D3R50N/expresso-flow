const { default: axios } = require("axios");
const config = require("../config");
const Router = require("../lib/router");
const { safeValue, appUrl, debug } = require("../lib/utils");
const ExpressoFlow = require("../index");


class Facebook {
  static #appId;
  static #appSecret;
  static #webhookVerify;
  static #paths = {
    callback: "/auth/fb/callback",
    login: "/auth/fb",
    webhook: "/auth/fb/webhook",
  };

  static _scopes = {
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

  static _page_scopes = [
    this._scopes.pagesManageMetadata,
    this._scopes.pagesMessaging,
    this._scopes.pagesReadEngagement,
  ];
  static _default_scopes = [this._scopes.email, this._scopes.publicProfile];

  static #loginScopes = this._default_scopes;

  static #keys = {
    user_access_token: "fb.user_access_token",
    incoming_entries: "fb.incoming_entries",
  };

  static #callbackHandler = (req, res) => {
    debug.log("Token", this.getUserAccessToken(req));
    res.send("Success");
  };

  static #webhookHandler = (req, res) => {
    debug.log("Incoming messages", this.getIncomingMessage(req));
    res.send("Success");
  };

  static init(
    app,
    options = {
      appId,
      appSecret,
      webhookVerify,
      loginScopes,
      callbackUrl,
      loginUrl,
      webhookUrl,
      callbackHandler,
      webhookHandler,
    }
  ) {
    let {
      appId,
      appSecret,
      webhookVerify,
      loginScopes,
      callbackUrl,
      loginUrl,
      webhookUrl,
      callbackHandler,
      webhookHandler,
    } = options;

    this.#appId = safeValue(appId, config.FACEBOOK_APP_ID);
    this.#appSecret = safeValue(appSecret, config.FACEBOOK_APP_SECRET);
    this.#webhookVerify = safeValue(
      webhookVerify,
      config.FACEBOOK_WEBHOOK_VERIFY
    );

    this.#loginScopes = safeValue(loginScopes, this._default_scopes);
    this.#paths.login = safeValue(loginUrl, this.#paths.login);
    this.#paths.callback = safeValue(callbackUrl, this.#paths.callback);
    this.#paths.webhook = safeValue(webhookUrl, this.#paths.webhook);
    this.#callbackHandler = safeValue(callbackHandler, this.#callbackHandler);
    this.#webhookHandler = safeValue(webhookHandler, this.#webhookHandler);

    app.use(this.#_middleware);
  }

  static #redirectUri(req) {
    return `${appUrl(req)}${this.#paths.callback}`;
  }

  static async retrieveShortToken(code, redirect_uri) {
    try {
      const request = await axios.get(
        `https://graph.facebook.com/oauth/access_token`,
        {
          params: {
            client_id: this.#appId,
            redirect_uri,
            client_secret: this.#appSecret,
            code,
          },
        }
      );

      return request.data.access_token;
    } catch (error) {
      return null;
    }
  }

  static async retrieveLongToken(short_token) {
    try {
      const request = await axios.get(
        `https://graph.facebook.com/oauth/access_token`,
        {
          params: {
            grant_type: "fb_exchange_token",
            client_id: this.#appId,
            client_secret: this.#appSecret,
            fb_exchange_token: short_token,
          },
        }
      );

      return request.data.access_token;
    } catch (error) {
      return null;
    }
  }

  static async retrieveUserPages(access_token) {
    try {
      const res = await axios.get(`https://graph.facebook.com/me/accounts`, {
        params: {
          access_token,
        },
      });
      return res.data.data;
    } catch (error) {
      return [];
    }
  }

  static async subscribeToWebhook(pageId, page_access_token) {
    try {
      const res = await axios.post(
        `https://graph.facebook.com/${pageId}/subscribed_apps`,
        null,
        {
          params: {
            access_token: page_access_token,
            subscribed_fields: "messages,messaging_postbacks",
          },
        }
      );

      return res.data.success;
    } catch (error) {
      return false;
    }
  }

  static async unsubscribeToWebhook(pageId, page_access_token) {
    try {
      const res = await axios.delete(
        `https://graph.facebook.com/${pageId}/subscribed_apps?access_token=${page_access_token}`
      );

      return res.data.success;
    } catch (error) {
      return false;
    }
  }

  static async sendMessage(
    page_access_token,
    recipient_id,
    { text, attachment, quick_replies }
  ) {
    try {
      const res = await axios.post(
        `https://graph.facebook.com/me/messages`,
        {
          recipient: { id: recipient_id },
          message: { text, attachment, quick_replies },
        },
        {
          params: {
            access_token: page_access_token,
          },
        }
      );
      return res.data;
    } catch (error) {
      return null;
    }
  }

  static getUserAccessToken(req) {
    const access_token = ExpressoFlow.of(req).getLocal(
      this.#keys.user_access_token
    );
    return access_token;
  }

  static getIncomingMessage(req) {
    const entries = ExpressoFlow.of(req).getLocal(
      this.#keys.incoming_entries
    );
    return entries;
  }

  static async getUserPages(req) {
    const access_token = this.getUserAccessToken(req);
    const pages = await this.retrieveUserPages(access_token);
    return pages;
  }
  static get #_middleware() {
    const router = Router();

    router.get(this.#paths.callback, async (req, res) => {
      const { code } = req.query;

      const short_token = await this.retrieveShortToken(
        code,
        this.#redirectUri(req)
      );
      const long_token = await this.retrieveLongToken(short_token);

      ExpressoFlow.of(req, res).setLocal(
        this.#keys.user_access_token,
        long_token
      );

      this.#callbackHandler(req, res);
    });

    router.get(this.#paths.login, (req, res) => {
      const url = `https://www.facebook.com/dialog/oauth?client_id=${
        this.#appId
      }&redirect_uri=${this.#redirectUri(req)}&scope=${this.#loginScopes.join(
        ","
      )}&response_type=code`;
      res.redirect(url);
    });

    router.get(this.#paths.webhook, (req, res) => {
      const mode = req.query["hub.mode"];
      const challenge = req.query["hub.challenge"];
      const verify_token = req.query["hub.verify_token"];
      if (mode == "subscribe" && verify_token == this.#webhookVerify)
        return res.send(challenge);

      res.status(400).send("No");
    });

    router.post(this.#paths.webhook, (req, res) => {
      ExpressoFlow.of(req, res).setLocal(
        this.#keys.incoming_entries,
        req.body.entry
      );

      this.#webhookHandler(req, res);
    });
    return router;
  }
}

module.exports = Facebook;
