'use strict'

const Koa = require('koa');
const sha1 = require('sha1');
const config = {
    wechat: {
        appID: 'wxcaf0ab7eaa4a6e00',
        appsecret: '3367d493de9248d0d7bfc9bc1fb116b2',
        token: 'lantu'
    }
};

const app = new Koa();

app.use(async (ctx,next) => {
    console.log(ctx.query);

    const token = config.wechat.token;
    const signature = ctx.query.signature;
    const nonce = ctx.query.nonce;
    const timestamp = ctx.query.timestamp;
    const ecostr = ctx.query.ecostr;

    let str = [token, timestamp, nonce].sort().join('');
    let sha = sha1(str);

    if(sha === signature) {
        ctx.body = ecostr + ''
    } else {
        ctx.body = 'wrong'
    }
});

app.listen(8000);
console.log('Listening:1234');