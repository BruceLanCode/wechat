'use strict'

const ejs = require('ejs');
const heredoc = require('heredoc');

let tpl = heredoc(() => {/*
    <xml>
    <ToUserName><![CDATA[<% ToUserName %>]]></ToUserName>
    <FromUserName><![CDATA[<% FromUserName% >]]></FromUserName>
    <CreateTime><% createTime %></CreateTime>
    <MsgType><![CDATA[<% msgType %>]]></MsgType>
    <% if (msgType === 'text') { %>
        <Content><![CDATA[<%- content %.]]></Content>
    <% } else if(msgType ==='image') { %>
        <Image>
            <MediaId><![CDATA[<% content.media_id %>]]></MediaId>
        </Image>
    <% else if (msgType === 'voice') { %>
        <Voice>
            <MediaId><![CDATA[<% content.media_id %>]]></MediaId>
        </Voice>
    </xml>
*/})