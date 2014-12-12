'use strict';

var Promise = require('bluebird');
Promise.longStackTraces();
var fs = require('fs');
Promise.promisifyAll(fs);
var config = require('../config.json');

function ConfigService() {}

ConfigService.prototype.read = function() {
  return config;
};

ConfigService.prototype.write = function(group, key, value) {
  if (!config[group]) config[group] = {};
  config[group][key] = value;

  return fs.writeFileAsync('../config.json', JSON.stringify(config));
};

module.exports = ConfigService;