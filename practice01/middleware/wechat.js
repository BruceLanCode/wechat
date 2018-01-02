'use strict'

const Promise = require('bluebird');
const request = Promise.promisify(require('request'));
const util = require('./util');

const prefix = 'https://api.weixin.qq.com/cgi-bin/token';
const api = {
    accessToken: prefix + '?grant_type=client_credential'
}

class Wechat {
    constructor(props) {
        this.appID = props.appID;
        this.appSecret = props.appsecret;
        this.getAccessToken = props.getAccessToken;
        this.saveAccessToken = props.saveAccessToken;

        this.getAccessToken()
            .then(data => {
                try {
                    data = JSON.parse(data);
                }
                catch(e) {
                    // console.log(e);
                    return this.updateAccessToken()
                }

                if(this.isValidAccessToken(data)) {
                    return Promise.resolve(data);
                } else {
                    return this.updateAccessToken()
                }
            })
            .then(data => {
                this.access_token = data.access_token;
                this.expires_in = data.expires_in;

                this.saveAccessToken(data);
            })
    }

    isValidAccessToken(data) {
        if(!data || !data.access_token || !data.expires_in) {
            return false;
        }

        let expires_in = data.expires_in;
        let now = (new Date().getTime());

        if(now < expires_in) {
            return true;
        } else {
            return false;
        }
    }

    updateAccessToken() {
        const appID = this.appID;
        const appSecret = this.appSecret;
        const url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;

        return new Promise((resolve,reject) => {
            request({
                url,
                json: true
            }).then(res => {
                let data = res.body;
                let now = (new Date().getTime());
                let expires_in = now + (data.expires_in - 20) * 1000;

                data.expires_in = expires_in;

                resolve(data);
            }).catch(err => {
                console.log(err)
            })
        });
    }

    replay() {
        // let content = this.body;
        let content = this.weixin.Content;
        let message = this.weixin;

        let xml = util.tpl(content, message);

        this.status = 200;
        this.type = 'text/xml';
        // console.log(xml);
        this.body = xml;
    }
}

module.exports = Wechat;