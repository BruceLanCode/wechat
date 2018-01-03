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
        upload: prefix + 'media/upload?',
        fetch: prefix + 'media/get?'
    },
    permanent: {
        upload: prefix +  'material/add_material?',
        fetch: prefix + 'material/get_material?',
        uploadNews: prefix + 'material/add_news?',
        uploadNewsPic: prefix + 'media/uploadimg?',
        del: prefix + 'material/del_material?',
        update: prefix + 'material/update_news?',
        count: prefix + 'material/get_materialcount?',
        batch: prefix + 'material/batchget_material?'
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
                    if (type !== 'pic' && type !== 'news') {
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
                    request(options).then(res => {
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

    fetchMaterial(mediaId, type, permanent) {
        let fetchUrl = api.temporary.fetch;

        if(permanent) {
            fetchUrl = api.permanent.fetch;
        }

        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url = fetchUrl + 'access_token=' + data.access_token +
                    '&media_id=' + mediaId;
                    if (!permanent && type === 'video') {
                        url = url.replace('https://','http://');
                    }
                    resolve(url);
                });
        });
    }

    deleteMaterial(mediaId) {
        let form = {
            media_id: mediaId
        };

        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url = api.permanent.del + 'access_token=' + data.access_token +
                        '&media_id=' + mediaId;
                    request({
                        method: 'POST',
                        url,
                        body: form,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        // console.log('wechat.js upload',_data);
                        if(_data) {
                            resolve(_data);
                        } else {
                            throw new Error('delete material fails');
                        }
                    }).catch(err => {
                        // console.log(err)
                        reject(err);
                    });
                });
        });
    }

    updateMaterial(mediaId, news) {
        let form = {
            media_id: mediaId
        };

        _.extend(form,news);

        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url = api.permanent.update + 'access_token=' + data.access_token +
                        '&media_id=' + mediaId;
                    request({
                        method: 'POST',
                        url,
                        body: form,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        // console.log('wechat.js upload',_data);
                        if(_data) {
                            resolve(_data);
                        } else {
                            throw new Error('update material fails');
                        }
                    }).catch(err => {
                        // console.log(err)
                        reject(err);
                    });
                });
        });
    }

    countMaterial() {
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url = api.permanent.count + 'access_token=' + data.access_token +;
                    request({
                        method: 'GET',
                        url,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        if(_data) {
                            resolve(_data);
                        } else {
                            throw new Error('count material fails');
                        }
                    }).catch(err => {
                        // console.log(err)
                        reject(err);
                    });
                });
        });
    }

    batchMaterial(options) {

        options.type = options.type || 'image',
        options.offset = options.offset || 0,
        options.count = options.count || 1,
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url = api.permanent.batch + 'access_token=' + data.access_token +;
                    request({
                        method: 'POST',
                        url,
                        body: options,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        if(_data) {
                            resolve(_data);
                        } else {
                            throw new Error('batch material fails');
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