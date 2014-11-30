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
var HerokuService = require('./services/heroku-service');
var LoaderIoService = require('./services/loaderio-service');

function run() {
  var repo;
  var herokuService = new HerokuService(config.heroku);
  var loaderService = new LoaderIoService(config.loaderIo);

  return git.initAsync('./').then(function (result) {
    repo = result;
    Promise.promisifyAll(repo);

    if (herokuService.authToken) return herokuService.authToken;
    return herokuService.getAuthToken(config.heroku.username, config.heroku.password);
  }).then(function (authToken) {
    config.heroku.authToken = authToken; // write to a permanent config file
    herokuService.setAuthToken(authToken);
  }).then(function () {
    if (herokuService.appName) return herokuService.appName;

    return herokuService.createApp();
  }).then(function (appName) {
    config.heroku.appName = appName;
    herokuService.appName = appName;
  }).then(function () {
    return herokuService.getAddons();
  }).then(function (addons) {
    var addonNames = _.map(addons, 'name');
    var newAddons = _.difference(['loaderio', 'mongohq', 'papertrail', 'rediscloud'], addonNames);
    console.log('Creating addons: ', newAddons);
    return Promise.all(_.map(newAddons, function (addon) {
      return herokuService.createAddon(addon);
    }));
  }).then(function () {
    if (!loaderService.authToken) {
      return herokuService.getConfig('LOADERIO_API_KEY').then(function (configVars) {
        config.loaderIo.authToken = configVars.LOADERIO_API_KEY;
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
    return repo.remote_pushAsync('heroku_loadtest', 'development:master');
  }).then(function () {
    console.log('Deployment complete.');
  });
}

module.exports = run;

if (!module.parent) {
  run();
}