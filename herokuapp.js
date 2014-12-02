'use strict';

var Promise = require('bluebird');
Promise.longStackTraces();

var request = require('request');
var requestAsync = Promise.promisify(request);
Promise.promisifyAll(request);
var git = require('gift');
Promise.promisifyAll(git);
var _ = require('lodash');
var HerokuService = require('./services/heroku-service');
var LoaderIoService = require('./services/loaderio-service');

function HerokuApp(config) {
  this.herokuService = new HerokuService(config.heroku);
  this.loaderService = new LoaderIoService(config.loaderIo);
}

HerokuApp.prototype.createApp = function() {
  var that = this;
  return Promise.resolve().then(function () {
    if (that.herokuService.authToken) return that.herokuService.authToken;
    //that.herokuService.getAuthToken(that.herokuService.username, that.herokuService.password).then(console.log);
    return that.herokuService.getAuthToken(that.herokuService.username, that.herokuService.password);
  }).then(function (authToken) {
    that.herokuService.setAuthToken(authToken);
  }).then(function () {
    if (that.herokuService.appName) return that.herokuService.appName;
    return that.herokuService.createApp();
  }).then(function (appName) {
    that.herokuService.appName = appName;
  });
};

HerokuApp.prototype.run = function() {
  var repo;
  var that = this;

  return git.initAsync('./').then(function (result) {
    repo = result;
    Promise.promisifyAll(repo);
  }).then(function () {
    return that.createApp();
  }).then(function () {
    return that.herokuService.getAddons();
  }).then(function (addons) {
    var addonNames = _.map(addons, 'name');
    var newAddons = _.difference(['loaderio', 'mongohq', 'papertrail', 'rediscloud'], addonNames);
    //console.log('Creating addons: ', newAddons);
    return Promise.all(_.map(newAddons, function (addon) {
      return that.herokuService.createAddon(addon);
    }));
  }).then(function () {
    if (!that.loaderService.authToken) {
      return that.herokuService.getConfig('LOADERIO_API_KEY').then(function (configVars) {
        that.loaderService.authToken = configVars.LOADERIO_API_KEY;
      });
    }
  }).then(function () {
    return repo.remote_listAsync();
  }).then(function (repos) {
    if (_.contains(repos, 'heroku_loadtest')) {
      return repo.remote_removeAsync('heroku_loadtest');
    }
  }).then(function () {
    return repo.remote_addAsync('heroku_loadtest', 'git@heroku.com:' + that.herokuService.appName + '.git');
  }).then(function () {
    //console.log('-- Deploying to Heroku...');
    return repo.remote_pushAsync('heroku_loadtest', 'development:master');
  }).then(function () {
    //console.log('Deployment complete.');
  });
};

module.exports = HerokuApp;

/* istanbul ignore if */
if (!module.parent) {
  new HerokuApp(require('./config')).run();
}