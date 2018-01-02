'use strict'

const config = require('./config');
const Wechat = require('./middleware/wechat');
let wechatApi = new Wechat(config.wechat);

exports.reply = async function(next) {
    let message = this.weixin;
    if (message.MsgType === 'event') {
        if (message.Event === 'subscribe') {
            if (message.EventKey) {
                console.log('扫码二维码进来的' + message.EventKey + ' ' + message.ticket);
            }
            this.body = '哈哈，你订阅了找个号\n';

        }
        else if (message.Event === 'unsubscribe') {
            console.log('无情取关');
            this.body = '';
        }
        else if (message.Event === 'LOCATION') {
            this.body = '您上报的位置是:' + message.Latitude + '/' + message.Longitude +
                '-' + 'message.Precision';
        }
        else if (message.Event === 'CLICK') {
            this.body = '您点击了菜单：' + message.EventKey;
        }
        else if (message.Event === 'SCAN') {
            console.log('关注后扫二维码' + message.EventKey + ' ' + message.Ticket);
            this.body = '看到你扫了一下';
        }
        else if (message.Event === 'VIEW') {
            this.body = '您点击了菜单中的链接:' + message.EventKey;
        }
    }
    else if (message.MsgType === 'text'){
        let content = message.Content;
        let reply = '额，你说的 ' + message.Content + ' 太复杂了';

        if (content === '1') {
            reply = '天下第一吃大米'
        }
        else if(content === '2') {
            reply = '天下第二吃豆腐';
        }
        else if (content === '3') {
            reply = '天下第三吃仙丹';
        }
        else if (content === '4') {
            reply = [{
                title: '技术改变世界',
                description: '只是个描述',
                picUrl: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1514909010829&di=3cb0f2f8dbe20681179ab7ade4e0220c&imgtype=0&src=http%3A%2F%2Fcomic.sinaimg.cn%2F2012%2F0330%2FU7154P1157DT20120330144831.jpg',
                url: 'https://github.com/'
            },{
                title: 'Nodejs开发微信',
                description: '厉害',
                picUrl: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1515503820&di=7091541b805892cfcb76d079c148d6b1&imgtype=jpg&er=1&src=http%3A%2F%2Fimg.newyx.net%2Fnewspic%2Fimage%2F201501%2F30%2Fdf6c172723.jpg',
                url: 'https://nodejs.org/'
            }]
        }
        else if (content === '5') {
            let data = await wechatApi.uploadMaterial('image', __dirname + '/2.png');

            reply = {
                type: 'image',
                media_id: data.media_id
            }
        }

        this.body = reply;
    }
    await next();
}