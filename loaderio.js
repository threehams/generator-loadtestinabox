'use strict';

var Promise = require('bluebird');
Promise.longStackTraces();

var request = require('request');
var requestAsync = Promise.promisify(request);
var config = require('./config');

function run() {
  var params;
  var headers = { 'loaderio-auth': config.loaderIo.authToken };
  Promise.resolve().then(function () {
    params = {
      method: 'GET',
      url: 'https://api.loader.io/v2/apps',
      headers: headers
    };
    return requestAsync(params);
  }).spread(function (response, body) {
    if (response.statusCode >= 400) throw new Error(body);
    if (JSON.parse(body).length) return;
    params = {
      method: 'POST',
      url: 'https://api.loader.io/v2/apps',
      headers: headers,
      json: true,
      body: {
        app: 'https://' + config.heroku.appName + '.herokuapp.com'
      }
    };
    return requestAsync(params).spread(function (response, body) {
      if (response.statusCode >= 400) throw new Error(body);
      config.loaderIo.appId = body.app_id;
      config.loaderIo.verificationToken = body.verification_id;
    });
  }).then(function () {
    params = {
      method: 'PATCH',
      url: 'https://api.heroku.com/apps/' + config.heroku.appName + '/config-vars',
      headers: {
        'Authorization': 'Bearer ' + config.heroku.authToken,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.heroku+json; version=3'
      },
      json: true,
      body: {
        LOADER_IO_VERIFICATION_TOKEN: config.loaderIo.verificationToken
      }
    };
    return requestAsync(params);
  }).then(function () {
    console.log(config.loaderIo.appId);
    params = {
      method: 'POST',
      url: 'https://api.loader.io/v2/apps/' + config.loaderIo.appId + '/verify',
      headers: headers
    };
    return requestAsync(params).spread(function (response, body) {
      if (response.statusCode >= 400) throw new Error(body);
      console.log(response.statusCode);
      console.log(body);
      //config.loaderIo.verificationToken = JSON.parse(body).verification_id;

      process.exit(0);
    });
  }).then(function () {
    params = {
      method: 'POST',
      url: 'https://api.loader.io/v2/tests',
      headers: headers,
      json: true,
      body: {
        test_type: 'non-cycling',
        urls: [{
          url: config.heroku.appName
        }],
        duration: 60,
        initial: 0,
        total: 10000
      }
    };
    return requestAsync(params)
  }).spread(function (response, body) {

  }).catch(function (error) {
    console.log(error.stack);
    console.log(error.message);
    throw error;
  });
}

module.exports = run;

if (!module.parent) {
  run();
}