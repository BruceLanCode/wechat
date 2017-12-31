'use strict'

const sha1 = require('sha1');
const Promise = require('bluebird');
const request = Promise.promisify(require('request'));

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
                    // console.log('Promise:',Promise);
                    Promise.resolve(data);
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
            })
        });
    }
}

module.exports = config =>{
    let wechat = new Wechat(config.wechat);
    return async (ctx,next) => {
        console.log(ctx.query);

        const token = config.wechat.token;
        const signature = ctx.query.signature;
        const nonce = ctx.query.nonce;
        const timestamp = ctx.query.timestamp;
        const echostr = ctx.query.echostr;

        let str = [token, timestamp, nonce].sort().join('');
        let sha = sha1(str);
        console.log(sha);
        console.log(signature);
        console.log(echostr);

        if(sha === signature) {
            ctx.body = echostr;
        } else {
            ctx.body = 'wrong'
        }
    }
};