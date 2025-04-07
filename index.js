const Facebook = require("./core/facebook");

class ExpressoFlow {
  #req;
  #res;

  constructor(req, res) {
    this.#req = req;
    this.#res = res;
  }

  static of(req, res) {
    return new ExpressoFlow(req, res);
  }

  setLocal(key = "", value) {
    const ef = this.#req.ef ?? {};
    let _ = ef;
    const keys = key.split(".").filter((k) => k.trim() != "");
    for (let i in keys) {
      const k = keys[i];
      if (i == keys.length - 1) _[k] = value;
      else {
        ef[k] = {};
        _ = ef[k];
      }
    }

    this.#req.ef = ef;
  }

  getLocal(key = "") {
    const ef = this.#req.ef ?? {};
    let _ = ef;
    const keys = key.split(".").filter((k) => k.trim() != "");
    for (let i in keys) {
      const k = keys[i];
      if (i == keys.length - 1) return _[k];
      else {
        _ = ef[k];
      }
    }
  }

}

module.exports = ExpressoFlow;
