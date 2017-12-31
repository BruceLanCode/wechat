'use strict'

const fs = require('fs');
const Promise = require('bluebird');

exports.readFileAsync = (fpath, encoding='utf8') => (
    new Promise((resolve, reject) => {
        console.log('promise')
        fs.readFile(fpath, encoding, (err, content) => {
            if(err) reject(err);
            else resolve(content);
        })
    })
);

exports.writeFileAsync = (fpath, content) => (
    new Promise((resolve, reject) => {
        fs.writeFile(fpath, content, (err) => {
            if(err) reject(err);
            else resolve();
        })
    })
);