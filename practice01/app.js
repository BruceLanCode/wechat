'use strict'

const Koa = require('koa');
const path = require('path');

const util = require('./libs/util');
const validateMid = require('./middleware/validate');
const wechat_file = path.join(__dirname, './config/wechat_file.txt');
const config = {
    wechat: {
        appID: 'wxcaf0ab7eaa4a6e00',
        appsecret: '3367d493de9248d0d7bfc9bc1fb116b2',
        token: 'lantu',
        getAccessToken: () => (util.readFileAsync(wechat_file)),
        saveAccessToken: (data) => {
            data = JSON.stringify(data);
            return util.writeFileAsync(wechat_file,data);
        }
    }
};

const app = new Koa();

app.use(validateMid(config));

app.listen(8000);
console.log('Listening:8000');