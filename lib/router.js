const express = require('express');
const bodyparser = require("body-parser");

function Router() {
    const router = express();
    router.use(bodyparser.json());
    router.use(bodyparser.urlencoded({extended:true}))
    return router;
}

module.exports = Router;