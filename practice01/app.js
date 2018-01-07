'use strict'

const Koa = require('koa');
const ejs = require('ejs');
const heredoc = require('heredoc');
const shasum = require('shasum');

const validateMid = require('./middleware/validate');
const weixin = require('./weixin.js');
const Wechat = require('./middleware/wechat');
const config = require('./config.js');

const app = new Koa();

const movieTpl = heredoc(() => {/*
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,minimum-scale=1">
    <title>搜电影</title>
</head>
<body>
    <h1>点击标题，开始录音</h1>
    <div id="keyword">您搜索的电影为： <span></span></div>
    <div id="title"></div>
    <div id="director"></div>
    <div id="year"></div>
    <div id="poster"></div>
    <script src="https://cdn.bootcss.com/zepto/1.0rc1/zepto.min.js"></script>
    <script src="http://res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>
    <script>
        wx.config({
            debug: false,
            appId: '<%= appId %>',
            timestamp: '<%= timestamp %>',
            nonceStr: '<%= noncestr %>',
            signature: '<%= signature %>',
            jsApiList: [
                'startRecord',
                'stopRecord',
                'onVoiceRecordEnd',
                'translateVoice',
                'previewImage'
            ]
        });
        wx.ready(function() {
            wx.checkJsApi({
                jsApiList: ['translateVoice'],
                success: function(res) {
                    console.log('translateVoice');
                }
            });
            var isRecord = false
            var slider;
            $('#poster').on('tap',function(){
                if(slider.current) {
                    wx.previewImage(slider);
                }
            });
            $('h1').on('tap',function() {
                if(!isRecord) {
                    isRecord = true;
                    wx.startRecord({
                        cancel: function() {
                            window.alert('那就不能搜了');
                        }
                    });
                } else {
                    isRecord = false;
                    wx.stopRecord({
                        success: function(res) {
                            var localId = res.localId;
                             wx.translateVoice({
                                localId: localId,
                                isShowProgressTips: 1,
                                success: function (res) {
                                    $('#keyword>span').html(res.translateResult);
                                    $.ajax({
                                        url: 'https://api.douban.com/v2/movie/search?q=' + encodeURIComponent(res.translateResult),
                                        dataType: 'jsonp',
                                        success: function(data){
                                        console.log(data);
                                            if(data.subjects[0]){
                                                var subject = data.subjects[0];
                                                $('#title').html(subject.title);
                                                $('#year').html(subject.year);
                                                $('#director').html(subject.directors[0].name);
                                                $('#poster').html('<img src="' + subject.images.large + '" />');

                                                slider = {
                                                    current: subject.images.large,
                                                    urls: []
                                                }
                                                data.subjects.forEach(function(item){
                                                    slider.urls.push(item.images.large);
                                                });
                                            }
                                        }
                                    })
                                }
                            });
                        }
                    })
                }
            })
        });
    </script>
</body>
</html>
*/});

const createNonce = () => (Math.random().toString(36).substr(2,15));
const createTimestamp = () => (parseInt(new Date().getTime() / 1000, 10));
const _sign = (noncestr, ticket, timestamp, url) => {
    let params = [
        'noncestr=' + noncestr,
        'jsapi_ticket=' + ticket,
        'timestamp=' + timestamp,
        'url=' + url
    ];
    let str = params.sort().join('&');
    // console.log(str);
    return shasum(str);
}
const sign = (ticket, url) => {
    let noncestr = createNonce();
    let timestamp = createTimestamp();
    let signature = _sign(noncestr, ticket, timestamp, url);

    return {noncestr,timestamp,signature};
}

app.use(async (ctx, next) => {
    if(ctx.url.indexOf('/movie') > -1) {
        let wechatApi = new Wechat(config.wechat);
        let data = await wechatApi.fetchTicketToken();
        let ticket = data.ticket;
        // console.log(ticket);
        let url = ctx.href;
        let params = sign(ticket, url);
        params = {
            appId: config.wechat.appID,
            ...params
        };
        // console.log(params);
        ctx.body = ejs.render(movieTpl, params);
        return next;
    }
    await next();
})

app.use(validateMid(config, weixin.reply));

app.listen(1234);
console.log('Listening:1234');