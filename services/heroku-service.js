'use strict';

var Promise = require('bluebird');
Promise.longStackTraces();

var request = require('request');
var config = require('../config');

function HerokuService() {
  this.requestAsync = Promise.promisify(
    request.defaults({
      headers: {
        'Authorization': 'Bearer ' + config.heroku.authToken,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.heroku+json; version=3'
      },
      json: true
    })
  );
}

HerokuService.prototype.writeConfig = function() {
  var params = {
    method: 'PATCH',
    url: 'https://api.heroku.com/apps/' + config.heroku.appName + '/config-vars',
    body: {
      LOADERIO_VERIFICATION_TOKEN: config.loaderIo.verificationToken
    }
  };
  return this.requestAsync(params);
};

module.exports = HerokuService;