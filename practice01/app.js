'use strict'

const Koa = require('koa');

const validateMid = require('./middleware/validate');
const weixin = require('./weixin.js');
const config = require('./config.js');

const app = new Koa();

app.use(validateMid(config, weixin.reply));

app.listen(1234);
console.log('Listening:1234');