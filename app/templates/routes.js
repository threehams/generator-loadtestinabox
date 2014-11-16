module.exports = function(server, mongoDb, redisDb) {
  server.route({
    method: '',
    path: '/test1',
    handler: function (request, reply) {
      return reply({});
    }
  });

  server.route({
    method: '',
    path: '/test2',
    handler: function (request, reply) {
      return reply({});
    }
  });

  server.route({
    method: 'POST',
    path: '/reset',
    handler: function (request, reply) {
      redisDb.flushall(function () {
        mongoDb.getCollectionNames(function (err, result) {
          console.log(err);
          console.log(result);
          return reply({});
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/' + config.loaderIoToken + '/',
    handler: function (request, reply) {
      return reply(config.loaderIoToken);
    }
  });
};