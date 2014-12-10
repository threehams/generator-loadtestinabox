'use strict';

var Promise = require('bluebird');
Promise.longStackTraces();
var request = require('request');
var _ = require('lodash');
var services = require('../services');

var TEST_DURATION = 15;
var POLL_INTERVAL = 2000;

function LoaderService() {
  var config = services.configService.read().loader;

  this.verificationToken = config.verificationToken;
  this.appId = config.appId;
  this.hostname = config.hostname;
  this.authToken = config.authToken;
  this.requestAsync = Promise.promisify(
    request.defaults({
      headers: { 'loaderio-auth': this.authToken},
      json: true
    })
  );
}

LoaderService.prototype.HOST = 'https://api.loader.io';
LoaderService.prototype.ERROR_MESSAGES = {
  authToken: 'authToken is required. Run `node heroku.js`, or go to https://loader.io/settings for your key.',
  hostname: 'Hostname is required for the app to be tested. Run `node heroku.js`, or add an existing host to config.json.'
};

LoaderService.prototype.deleteApp = function(appId) {
  return this.requestAsync({
    method: 'DELETE',
    url: this.HOST + '/v2/apps/' + appId
  }).then(this._checkStatus);
};

LoaderService.prototype.createApp = function() {
  this._requireConfig(['hostname', 'authToken']);

  if (this.appId && this.verificationToken) return;
  var that = this;
  var params = {
    method: 'GET',
    url: this.HOST + '/v2/apps'
  };
  return this.requestAsync(params).then(that._checkStatus).spread(function (response, body) {
    if (body.length) { // if an app already exists
      var host = body[0];
      if (!_.contains(that.hostname, host.app)) throw new Error('A different host is already configured in loader.io: ' + host.app + 'Free accounts only support one host.');
      if (!that.verificationToken && host.status === 'verified') throw new Error('App already exists and is verified, but verificationToken is missing from config.json.');

      if (host.status !== 'verified') return that.deleteApp(host.app_id);

      that.appId = host.app_id;
    }
  }).then(function() {
    params = {
      method: 'POST',
      url: that.HOST + '/v2/apps',
      body: {
        app: that.hostname
      }
    };
    return that.requestAsync(params).then(that._checkStatus).spread(function (response, body) {
      // TODO actually need to write this to local environment somehow.
      that.appId = body.app_id;
      that.verificationToken = body.verification_id;
    });
  });
};

LoaderService.prototype.createTest = function(opts) {
  if (!opts.route) throw new Error('Route is required');

  return this.requestAsync({
    method: 'POST',
    url: this.HOST + '/v2/tests',
    body: {
      test_type: 'cycling',
      urls: [{
        request_type: 'GET',
        url: this.hostname + opts.route
      }],
      duration: TEST_DURATION,
      initial: 0,
      total: 1000
    }
  }).bind(this).then(this._checkStatus).spread(function (response, body) {
    return {
      testId: body.test_id,
      resultId: body.result_id
    };
  });
};

LoaderService.prototype.pollCompletion = function(testId, resultId) {
  var that = this;
  var url = this.HOST + '/v2/tests/' + testId + '/results/' + resultId;

  return Promise.delay(POLL_INTERVAL).then(function () {
    return that.requestAsync({url: url});
  }).bind(this).then(this._checkStatus).spread(function (response, body) {
    if (body.status === 'ready') return { responseTime: body.avg_response_time, successes: body.success };

    return that.pollCompletion(testId, resultId);
  });
};

LoaderService.prototype.runTest = function(testId) {
  if (!testId) throw new Error('testId is required');

  return this.requestAsync({
    method: 'PUT',
    url: this.HOST + '/v2/tests/' + testId + '/run'
  }).bind(this).then(this._checkStatus).spread(function (response, body) {
    return body.result_id;
  });
};

LoaderService.prototype.verifyApp = function() {
  var params = {
    method: 'POST',
    url: this.HOST + '/v2/apps/' + this.appId + '/verify'
  };
  return this.requestAsync(params).bind(this).then(this._checkStatus);
};

LoaderService.prototype._checkStatus = function(responseBody) {
  if (responseBody[0].statusCode >= 400) throw new Error(JSON.stringify(responseBody[1]));
  return responseBody;
};

LoaderService.prototype._requireConfig = function(attrs) {
  var that = this;

  _.forEach(attrs, function (attr) {
    if (!that[attr]) throw new Error(that.ERROR_MESSAGES[attr]);
  });
};

module.exports = LoaderService;
