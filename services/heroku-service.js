'use strict';

var Promise = require('bluebird');
Promise.longStackTraces();
var request = require('request');

function HerokuService(config) {
  this.appName = config.appName;
  this.authToken = config.authToken;
  this.username = config.username;
  this.password = config.password;
  this._setHeaders();
}

HerokuService.prototype.HOST = 'https://api.heroku.com';

HerokuService.prototype.createAddon = function(addon) {
  return this.requestAsync({
    method: 'POST',
    url: this.HOST + '/apps/' + this.appName + '/addons',
    body: {
      plan: addon
    }
  }).bind(this).then(this._checkStatus);
};

HerokuService.prototype.createApp = function() {
  var params = {
    method: 'POST',
    url: this.HOST + '/apps'
  };
  return this.requestAsync(params).bind(this).then(this._checkStatus).spread(function (response, body) {
    return body.name;
  });
};

HerokuService.prototype.getAddons = function() {
  var params = {
    method: 'GET',
    url: 'https://api.heroku.com/apps/' + this.appName + '/addons'
  };
  return this.requestAsync(params).bind(this).then(this._checkStatus).spread(function(response, body) {
    return body;
  });
};

HerokuService.prototype.getAuthToken = function(email, password) {
  var headers = {
    'Authorization': new Buffer(email + ':' + password).toString('base64'),
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.heroku+json; version=3'
  };
  var params = {
    method: 'POST',
    url: this.HOST + '/oauth/authorizations',
    headers: headers,
    json: true
  };
  return this.requestAsync(params).bind(this).then(this._checkStatus).spread(function (response, body) {
    return body.access_token.token;
  });
};

HerokuService.prototype.getConfig = function() {
  var params = {
    method: 'GET',
    url: this.HOST + '/apps/' + this.appName + '/config-vars'
  };
  return this.requestAsync(params).bind(this).then(this._checkStatus).spread(function (response, body) {
    return body;
  });
};

HerokuService.prototype.setAuthToken = function(authToken) {
  this.authToken = authToken;
  this._setHeaders();
};

HerokuService.prototype.setConfig = function(opts) {
  var params = {
    method: 'PATCH',
    url: this.HOST + '/apps/' + this.appName + '/config-vars',
    body: opts
  };
  return this.requestAsync(params).bind(this).then(this._checkStatus);
};

HerokuService.prototype._checkStatus = function(responseBody) {
  if (responseBody[0].statusCode >= 400) throw new Error(JSON.stringify(responseBody[1]));
  return responseBody;
};

HerokuService.prototype._setHeaders = function() {
  this.requestAsync = Promise.promisify(
    request.defaults({
      headers: {
        'Authorization': 'Bearer ' + this.authToken,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.heroku+json; version=3'
      },
      json: true
    })
  );
};

module.exports = HerokuService;