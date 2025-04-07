const Facebook = require("../core/facebook");

class FacebookPage {
  id;
  access_token;

  constructor(id, access_token) {
    this.id = id;
    this.access_token = access_token;
  }

  subscribeToWebhook() {
    return Facebook.subscribeToWebhook(this.id, this.access_token);
  }

  unsubscribeToWebhook() {
    return Facebook.unsubscribeToWebhook(this.id, this.access_token);
  }

  sendMessageText(recipient_id, text) {
    return Facebook.sendMessage(this.access_token, recipient_id, {
      text,
    });
  }
}


module.exports = 
    FacebookPage
