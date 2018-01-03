'use strict'

const Promise = require('bluebird');
const request = Promise.promisify(require('request'));
const fs = require('fs');
const _ = require('lodash');
const util = require('./util');

const prefix = 'https://api.weixin.qq.com/cgi-bin/';
const api = {
    accessToken: prefix + 'token?grant_type=client_credential',
    temporary: {
        upload: prefix + 'media/upload?'
    },
    permanent: {
        upload: prefix +  'material/add_material?',
        uploadNews: prefix + 'material/add_news?',
        uploadNewsPic: prefix + 'media/uploadimg?'
    }
}

class Wechat {
    constructor(props) {
        this.appID = props.appID;
        this.appSecret = props.appsecret;
        this.getAccessToken = props.getAccessToken;
        this.saveAccessToken = props.saveAccessToken;
        this.fetchAccessToken();
    }

    fetchAccessToken() {
        if (this.access_token && this.isValidAccessToken(this)) {
            return Promise.resolve(this);
        }

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
                return Promise.resolve(data);
            });
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
        let url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;

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

    uploadMaterial(type, material,permanent) {
        // console.log(filepath);
        let form = {};
        let uploadUrl = api.temporary.upload;

        if(permanent) {
            uploadUrl = api.permanent.upload;

            _.extend(form,permanent);
        }

        if(type === 'pic') {
            uploadUrl = api.permanent.uploadNewsPic;
        }
        if(type === 'news') {
            uploadUrl = api.permanent.uploadNews;
            form = material;
        } else {
            form.media = fs.createReadStream(material)
        }

        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url = uploadUrl + 'access_token=' + data.access_token ;
                    if (!permanent) {
                        url += '&type=' + type;
                    }
                    else {
                        form.access_token = data.access_token;
                    }
                    let options = {
                        method: 'POST',
                        url,
                        json: true
                    }
                    if(type === 'news') {
                        options.body = form;
                    }
                    else {
                        options.formData = form;
                    }
                    request({
                        method: 'POST',
                        url,
                        formData: form,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        // console.log('wechat.js upload',_data);
                        if(_data) {
                            resolve(_data);
                        } else {
                            throw new Error('Upload material fails');
                        }
                    }).catch(err => {
                        // console.log(err)
                        reject(err);
                    });
                });
        });
    }

    replay() {
        let content = this.body;
        // console.log(content);
        let message = this.weixin;

        let xml = util.tpl(content, message);

        this.status = 200;
        this.type = 'text/xml';
        console.log(xml);
        this.body = xml;
    }
}

module.exports = Wechat;