const config = require("../config");

function safeValue(...values) {
  for (let v of values) {
    if (v) return v;
  }

  return null;
}

function appUrl(req) {
  return `${req.protocol}://${req.host}`;
}

const debug = {
  log: (...m) => {
    if (config.isDev) console.log("[DEBUG]", ...m);
  },
};


module.exports = {
  safeValue,
  appUrl,
  debug,
};
