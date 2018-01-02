'use strict'

const path = require('path');

const util = require('./libs/util');
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

module.exports = config;