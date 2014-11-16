'use strict';
var config = require('./config');

module.exports = function(server, mongoDb, redisDb) {
  server.route({
    method: 'GET',
    path: '/test1',
    handler: function (request, reply) {
      return reply({});
    }
  });

  server.route({
    method: 'GET',
    path: '/test2',
    handler: function (request, reply) {
      return reply({});
    }
  });

  server.route({
    method: 'GET',
    path: '/reset',
    handler: function (request, reply) {
      redisDb.flushall(function () {
        //mongoDb.getCollections(function (err, result) {
        //  console.log(err);
        //  console.log(result);
        //  return reply({});
        //});
        return reply({});
      });
    }
  });

  if (config.loaderIo.verificationToken) {
    server.route({
      method: 'GET',
      path: '/' + config.loaderIo.verificationToken + '/',
      handler: function (request, reply) {
        return reply(config.loaderIo.verificationToken);
      }
    });
  }
};