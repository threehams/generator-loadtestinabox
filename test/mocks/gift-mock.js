'use strict';
var Promise = require('bluebird');

var fakeRepo = {
  remote_list: function(callback) {
    return callback(null, []);
  },
  remote_remove: function(name, callback) {
    return callback();
  },
  remote_add: function(name, path, callback) {
    return callback();
  },
  remote_push: function(remote, branch, callback) {
    console.log(remote);
    console.log(branch);
    return callback();
  }
};
var fakeGit = {
  initAsync: function(path) {
    return Promise.resolve(fakeRepo);
  }
};

module.exports = fakeGit;