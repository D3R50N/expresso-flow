import { Request, Response } from "express";

class ExpressoFlow {
  private req: Request;
  private res: Response | null;

  constructor(req: Request, res: Response | null) {
    this.req = req;
    this.res = res;
  }

  static of(req: Request, res: Response | null = null): ExpressoFlow {
    return new ExpressoFlow(req, res);
  }

  setLocal(key = "", value: any): void {
    const ef = this.req["ef"] ?? {};
    let _ = ef;
    const keys = key.split(".").filter((k) => k.trim() !== "");
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (i === keys.length - 1) _[k] = value;
      else {
        ef[k] = {};
        _ = ef[k];
      }
    }

    this.req["ef"] = ef;
  }

  getLocal(key = ""): any {
    const ef = this.req["ef"] ?? {};
    let _ = ef;
    const keys = key.split(".").filter((k) => k.trim() !== "");
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (i === keys.length - 1) return _[k];
      else {
        _ = ef[k];
      }
    }
  }
}

export default ExpressoFlow;
