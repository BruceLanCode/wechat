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
    },
    tags: {
        create: prefix + 'tags/create?',
        get: prefix + 'tags/get?',
        check: prefix + 'tags/getidlist?',
        update: prefix + 'tags/update?',
        batchcreate: prefix + 'tags/members/batchtagging?',
        delete: prefix + 'tags/delete?'
    },
    user: {
        getInfo: prefix + 'user/info?',
        batchgetInfo: prefix + 'user/info/batchget?',
        userList: prefix + 'user/get?'
    },
    mass: {
        preview: prefix + 'message/mass/preview?',
        get: prefix + 'message/mass/get?',
        sendall: prefix + 'message/mass/sendall?'
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
        console.log('upload:'+type);
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
                        console.log(_data);
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
        console.log('fetch:'+mediaId);
        let fetchUrl = api.temporary.fetch;

        if(permanent) {
            fetchUrl = api.permanent.fetch;
        }

        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url = fetchUrl + 'access_token=' + data.access_token;
                    let options = {method: 'POST',url,json: true};
                    let form = {};
                    if(permanent) {
                        form.media_id = mediaId;
                        form.access_token = data.access_token;
                        options.body = form;
                    }
                    else {
                        if (type === 'video') {
                            url = url.replace('https://','http://');
                        }
                        url += '&media_id=' + mediaId;
                    }
                    if(type === 'news' || type === 'video') {
                        request(options).then(res => {
                            let _data = res.body;
                            if(_data) {
                                resolve(_data);
                            } else {
                                throw new Error('fetch material fails');
                            }
                        }).catch(err => {
                            reject(err);
                        });
                    }
                    else {
                        resolve(url);
                    }
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
                    let url = api.permanent.count + 'access_token=' + data.access_token;
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

        options.type = options.type || 'image';
        options.offset = options.offset || 0;
        options.count = options.count || 1;
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url = api.permanent.batch + 'access_token=' + data.access_token;
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

    createTag(name) {
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then((data) => {
                    let url = api.tags.create + 'access_token=' + data.access_token;
                    let options = {
                        tag: {
                            name
                        }
                    };
                    request({
                        method: 'POST',
                        url,
                        body: options,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('create tag fails');
                        }
                    }).catch(err => {
                        // console.log(err)
                        reject(err);
                    });
                })
        })
    }

    getTag() {
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then((data) => {
                    let url = api.tags.get + 'access_token=' + data.access_token;
                    request({
                        method: 'POST',
                        url,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('get tag fails');
                        }
                    }).catch(err => {
                        console.log(err)
                    });
                })
        })
    }

    checkTag(openid) {
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then((data) => {
                    let url = api.tags.check + 'access_token=' + data.access_token;
                    let options = {
                        openid
                    };
                    request({
                        method: 'POST',
                        url,
                        body: options,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('get user\' tags fails');
                        }
                    }).catch(err => {
                        // console.log(err)
                        reject(err);
                    });
                })
        })
    }

    updateTag(id, name) {
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then((data) => {
                    let url = api.tags.update + 'access_token=' + data.access_token;
                    let options = {
                        tag: {
                            id,
                            name
                        }
                    };
                    request({
                        method: 'POST',
                        url,
                        body: options,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('update tags fails');
                        }
                    }).catch(err => {
                        // console.log(err)
                        reject(err);
                    });
                })
        })
    }

    batchCreateTag(openids, tagid) {
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then((data) => {
                    let url = api.tags.batchcreate + 'access_token=' + data.access_token;
                    let options = {
                        opeid_list: openids,
                        tagid
                    };
                    request({
                        method: 'POST',
                        url,
                        body: options,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('create tags fails');
                        }
                    }).catch(err => {
                        // console.log(err)
                        reject(err);
                    });
                })
        })
    }

    delTag(id) {
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then((data) => {
                    let url = api.tags.delete + 'access_token=' + data.access_token;
                    let options = {
                        tag: {
                            id
                        }
                    };
                    request({
                        method: 'POST',
                        url,
                        body: options,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('delete tags fails');
                        }
                    }).catch(err => {
                        // console.log(err)
                        reject(err);
                    });
                })
        })
    }

    getUserInfo(openid) {
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url;
                    let options;
                    if(_.isArray(openid)) {
                        url = api.user.batchgetInfo + 'access_token=' + data.access_token;
                        let openids = openid.map(id => ({openid:id,lang:'en'}))
                        options = {
                            method: 'POST',
                            url,
                            json: true,
                            body: {
                                user_list: openids
                            }
                        };
                    }else {
                        url = api.user.getInfo + 'access_token=' + data.access_token + '&openid=' + openid +'&lang=en';
                        options = {
                            method: 'GET',
                            url,
                            json: true
                        };
                    }
                    request(options).then(res => {
                        let _data = res.body;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('get user\'info fails');
                        }
                    }).catch(err => {
                        reject(err);
                    });
                })
        })
    }

    getUserList(openid='') {
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url = api.user.userList + 'access_token=' + data.access_token + '&next_openid=' + openid;
                    request({
                        method: 'GET',
                        url,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('get userList fails');
                        }
                    }).catch(err => {
                        reject(err);
                    });
                })
        })
    }

    previewMass(touser, msgtype, media_id) {
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url = api.mass.preview + 'access_token=' + data.access_token;
                    let form = {
                        touser,
                        msgtype,
                        [msgtype]: {
                            media_id: media_id
                        }
                    }
                    request({
                        method: 'POST',
                        url,
                        body: form,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('get userList fails');
                        }
                    }).catch(err => {
                        reject(err);
                    });
                })
        })
    }

    getMass(msg_id) {
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url = api.mass.get + 'access_token=' + data.access_token;
                    let form = {
                        msg_id
                    };
                    request({
                        method: 'POST',
                        url,
                        body: form,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('get userList fails');
                        }
                    }).catch(err => {
                        reject(err);
                    });
                })
        })
    }

    sendAll(filter, msgtype, media_id) {
        return new Promise((resolve,reject) => {
            this.fetchAccessToken()
                .then(data => {
                    let url = api.mass.sendall + 'access_token=' + data.access_token;
                    let form = {
                        filter,
                        msgtype,
                        [msgtype]: {
                            media_id
                        }
                    };
                    console.log(form);
                    request({
                        method: 'POST',
                        url,
                        body: form,
                        json: true
                    }).then(res => {
                        let _data = res.body;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('get userList fails');
                        }
                    }).catch(err => {
                        reject(err);
                    });
                })
        })
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