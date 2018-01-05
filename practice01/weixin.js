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
            this.body = '2018新年好,这是图少的测试公众号请放心使用';

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
            let data = await wechatApi.uploadMaterial('image', __dirname + '/material/2.png');

            reply = {
                type: 'image',
                media_id: data.media_id
            }
        }
        else if (content === '6') {
            let data = await wechatApi.uploadMaterial('video', __dirname + '/material/6-video.mp4');

            reply = {
                type: 'video',
                title: '回复视频内容',
                description: '教学视频',
                media_id: data.media_id
            }
        }
        else if (content === '7') {
            let data = await wechatApi.uploadMaterial('image', __dirname + '/material/2.png');

            reply = {
                type: 'music',
                title: '回复音乐内容',
                description: '放松一下',
                musicUrl: 'http://mpge.5nd.com/2015/2015-9-12/66325/1.mp3',
                thumbMediaId: data.media_id
            }
        }
        else if (content === '8') {
            let data = await wechatApi.uploadMaterial('image', __dirname + '/material/2.png',{type: 'image'});

            reply = {
                type: 'image',
                media_id: data.media_id
            }
        }
        else if (content === '9') {
            let data = await wechatApi.uploadMaterial('video', __dirname + '/material/6-video.mp4',
                {type: 'video',description: '{"title":"Really a nice place","introduction":"Never think it so easy"}'});

            reply = {
                type: 'video',
                title: '回复视频内容',
                description: '教学视频',
                media_id: data.media_id
            }
        }
        else if (content === '10') {
            let picData = await wechatApi.uploadMaterial('image', __dirname + '/material/2.png', {});
            let media = {
                articles: [{
                    title: 'tututu',
                    thumb_media_id: picData.media_id,
                    author: 'lantu',
                    digest: '没有摘要',
                    show_cover_pic: 1,
                    content: '没有内容',
                    content_source_url: 'https://github.com'
                },{
                    title: 'tututu2',
                    thumb_media_id: picData.media_id,
                    author: 'lantu',
                    digest: '没有摘要',
                    show_cover_pic: 1,
                    content: '没有内容',
                    content_source_url: 'https://github.com'
                }]
            };
            let data = await wechatApi.uploadMaterial('news',media,{});
            data = await wechatApi.fetchMaterial(data.media_id,'news',{});

            console.log(data);

            let items = data.news_item;
            let news = [];

            items.forEach((item) => {
                news.push({
                    title: item.title,
                    description: item.digest,
                    picUrl: picData.url,
                    url: item.url
                });
            });

            reply = news;
        }
        else if(content === '11') {
            let counts = await wechatApi.countMaterial()
            console.log(JSON.stringify(counts));

            let list1 = await wechatApi.batchMaterial({
                offset: 0,
                type: 'image',
                count: 10
            });
            let list2 = await wechatApi.batchMaterial({
                offset: 0,
                type: 'video',
                count: 10
            });
            let list3 = await wechatApi.batchMaterial({
                offset: 0,
                type: 'voice',
                count: 10
            });
            let list4 = await wechatApi.batchMaterial({
                offset: 0,
                type: 'news',
                count: 10
            });
            console.log(JSON.stringify([list1,list2,list3,list4]));
            reply = 'get info';
        }
        else if (content === '12') {
            // let tag = await wechatApi.createTag('兄弟组');
            // console.log('新分组;',tag);
            // let tag1 = await wechatApi.updateTag(102,'贱人组');
            // console.log('更新标签:',tag1);
            // let tag2 = await wechatApi.batchCreateTag(['omlMyxCp5sLkCqSjrT7LvbH3KCpQ'],103);
            // console.log('添加分组到死吃帮',tag2);
            // let tag3 = await wechatApi.delTag(102);
            // console.log('删除贱人组标签：',tag3);
            let tag4 = await wechatApi.checkTag(message.FromUserName);
            console.log('查看自己的标签:',tag4);
            let tags = await wechatApi.getTag();
            console.log('所有操作之后获取分组列表:',tags);
            reply = 'Tag done!'
        }
        else if (content === '13') {
            let user = await wechatApi.getUserInfo('omlMyxBAqBkadA7fDwvB61MPd7ps');
            console.log(user);
            let users = await wechatApi.getUserInfo(['omlMyxBAqBkadA7fDwvB61MPd7ps','omlMyxNa_t2HYGpmLOLVU_v30cPQ','omlMyxCp5sLkCqSjrT7LvbH3KCpQ']);
            console.log(users);
            reply = JSON.stringify(users);
        }
        else if (content === '14') {
            let userList = await wechatApi.getUserList();
            console.log(userList);
            reply = JSON.stringify(userList.total);
        }

        this.body = reply;
    }
    await next();
}