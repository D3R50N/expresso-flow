class Telegram {
  static #accesToken;
  static get base() {
    return `https://api.telegram.org/bot${this.#accesToken}`;
  }

  static init(token, options = {}) {
    this.#accesToken = token;
  }

  static actionUrl(action) {
    const url = `${this.base}/${action}`;
    console.log("[ACTION]:", url);
    return url;
  }

  static async sendMessage(text, chat_id, options = {}) {
    try {
      const data = await fetch(this.actionUrl("sendMessage"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          chat_id,
          ...options,
        }),
      });
      const json = await data.json();
      if (json.ok) return { messageId: json.result.message_id };
      else return {
        error: json.description,
        error_code: json.error_code,
      };
    } catch (error) {
      return {
        error: error.message,
        error_code: 500,
      };
    }
  }
}

module.exports = Telegram;
