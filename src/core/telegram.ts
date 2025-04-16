class Telegram {
  private static accesToken: string;

  private static get base() {
    return `https://api.telegram.org/bot${this.accesToken}`;
  }

  static init(token: string, options = {}): void {
    this.accesToken = token;
  }

  private static actionUrl(action: string): string {
    const url = `${this.base}/${action}`;
    console.log("[ACTION]:", url);
    return url;
  }

  static async sendMessage(
    text: string,
    chat_id: number | string,
    options: Record<string, any> = {}
  ): Promise<{ messageId?: number; error?: string; error_code?: number }> {
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
    } catch (error: any) {
      return {
        error: error.message,
        error_code: 500,
      };
    }
  }
}

export default Telegram;
