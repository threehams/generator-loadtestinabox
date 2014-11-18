'use strict';

var Promise = require('bluebird');
Promise.longStackTraces();

var request = require('request');
var requestAsync = Promise.promisify(request);
Promise.promisifyAll(request);
var git = require('gift');
Promise.promisifyAll(git);
var _ = require('lodash');
var config = require('./config');

function run() {
  var repo, headers, params;

  git.initAsync('./').then(function (result) {
    repo = result;
    Promise.promisifyAll(repo);

    if (config.heroku.authToken) return;
    headers = {
      'Authorization': new Buffer('threehams@gmail.com' + ':' + 'i7$v66NSa$H!m9yU').toString('base64'),
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.heroku+json; version=3'
    };
    params = {
      method: 'POST',
      url: 'https://api.heroku.com/oauth/authorizations',
      headers: headers
    };
    return requestAsync(params).spread(function (response, body) {
      config.heroku.authToken = JSON.parse(body).access_tokens[0].token;
    });
  }).then(function () {
    headers = {
      'Authorization': 'Bearer ' + config.heroku.authToken,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.heroku+json; version=3'
    };
    if (config.heroku.appName) return;

    params = {
      method: 'POST',
      url: 'https://api.heroku.com/apps',
      headers: headers
    };
    return requestAsync(params).spread(function (response, body) {
      var appData = JSON.parse(body);
      config.heroku.appName = appData.name;
      console.log(appData.name);
    });
  }).then(function () {
    params = {
      method: 'GET',
      url: 'https://api.heroku.com/apps/' + config.heroku.appName + '/addons',
      headers: headers
    };
    return requestAsync(params);
  }).spread(function (response, body) {
    var addons = _.map(JSON.parse(body), function (addon) {
      return addon.name;
    });
    var newAddons = _.difference(['loaderio', 'mongohq', 'papertrail', 'rediscloud'], addons);
    console.log('Creating addons: ', newAddons);
    return Promise.all(_.map(newAddons, function (addon) {
      return requestAsync({
        method: 'POST',
        url: 'https://api.heroku.com/apps/' + config.heroku.appName + '/addons',
        headers: headers,
        json: true,
        body: {
          plan: addon
        }
      });
    }));
  }).then(function () {
    if (!config.loaderIo.authToken) {
      params = {
        method: 'GET',
        url: 'https://api.heroku.com/apps/' + config.heroku.appName + '/config-vars',
        headers: headers
      };
      return requestAsync(params).spread(function (response, body) {
        config.loaderIo.authToken = JSON.parse(body).LOADERIO_API_KEY;
      });
    }
  }).then(function () {
    return repo.remote_listAsync();
  }).then(function (repos) {
    if (_.contains(repos, 'heroku_loadtest')) {
      return repo.remote_removeAsync('heroku_loadtest');
    }
  }).then(function () {
    return repo.remote_addAsync('heroku_loadtest', 'git@heroku.com:' + config.heroku.appName + '.git');
  }).then(function () {
    console.log('-- Deploying to Heroku...');
    return repo.remote_pushAsync('heroku_loadtest', 'master');
  }).then(function () {
    console.log('Deployment complete.');
  });
}

module.exports = run;

if (!module.parent) {
  run();
}