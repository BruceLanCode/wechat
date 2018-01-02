'use strict'

const sha1 = require('sha1');
const getRawBody = require('raw-body');
const contentType = require('content-type');
const Wechat = require('./wechat');
const util = require('./util');


module.exports = (config, handler) =>{
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

        if(ctx.method === 'GET') {
            if(sha === signature) {
                ctx.body = echostr;
            } else {
                ctx.body = 'wrong'
            }
        } else if (ctx.method === 'POST') {
            if(sha !== signature) {
                ctx.body = 'wrong';
                return false;
            }

            // console.log(ctx.request);
            let data = await getRawBody(ctx.req, {
                length: ctx.request.headers['content-length'],
                limit: '1mb',
                encoding: contentType.parse(ctx.req).parameters.charset
            });
            // console.log(data.toString());
            let content = await util.parseXMLAsync(data);
            // console.log(content);
            let message = util.formatMessage(content.xml);
            // console.log(message);

            // if(message.MsgType === 'event') {
            //     if(message.Event === 'subscribe') {
            //         let now = new Date().getTime();
            //         ctx.status = 200;
            //         ctx.type = 'text/xml';
            //         ctx.body = '<xml> ' +
            //             '<ToUserName><![CDATA[' + message.FromUserName + ']]></ToUserName> ' +
            //             '<FromUserName><![CDATA[' + message.ToUserName + ']]></FromUserName> ' +
            //             '<CreateTime>' + now +'</CreateTime> ' +
            //             '<MsgType><![CDATA[text]]></MsgType> ' +
            //             '<Content><![CDATA[2018新年好]]></Content>' +
            //             ' </xml>';
            //         return;
            //     }
            // }

            ctx.weixin = message;
            await handler.call(ctx, next);
            wechat.replay.call(ctx);
        }
    }
};