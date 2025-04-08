import Facebook from "./core/facebook";
import Telegram from "./core/telegram";
import ExpressoFlow from "./lib/ef";
import FacebookPage from "./lib/facebook-page";

const FB = Facebook;
const TG = Telegram;
const FBP = FacebookPage;

export { Facebook, FacebookPage, FB, FBP, Telegram, TG };
export default ExpressoFlow;
