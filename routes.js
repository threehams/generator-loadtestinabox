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
        return reply({});
      });
    }
  });

  if (process.env.LOADERIO_VERIFICATION_TOKEN) {
    server.route({
      method: 'GET',
      path: '/' + process.env.LOADERIO_VERIFICATION_TOKEN + '/',
      handler: function (request, reply) {
        return reply(process.env.LOADERIO_VERIFICATION_TOKEN);
      }
    });
  }
};