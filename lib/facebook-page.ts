import Facebook from "../core/facebook";


export default class FacebookPage {
  private id: string;
  private access_token: string;

  constructor(id: string, access_token: string) {
    this.id = id;
    this.access_token = access_token;
  }

  subscribeToWebhook(): Promise<boolean> {
    return Facebook.subscribeToWebhook(this.id, this.access_token);
  }

  unsubscribeToWebhook(): Promise<boolean> {
    return Facebook.unsubscribeFromWebhook(this.id, this.access_token);
  }

  sendMessageText(recipient_id: string, text: string): Promise<any> {
    return Facebook.sendMessage(this.access_token, recipient_id, { text });
  }
}
