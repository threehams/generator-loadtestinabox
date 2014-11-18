var Hapi = require('hapi');
var url = require('url');
var routes = require('./routes');
var config = require('./config');

function startServer() {
  var server = new Hapi.Server('0.0.0.0', process.env.PORT || 8000);
  console.log('starting server at 0.0.0.0:8000');
  mongoClient.connect(mongoUrl, function (err, mongo) {
    redisClient.auth(redisURL.auth.split(':')[1], function (err, result) {
      routes(server, mongo, redisClient);
      server.start();
    });
  });
}

var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;
var collection  = mongodb.Collection;
var redis = require('redis');

var mongoUrl = config.mongoUrl;
var redisURL = url.parse(config.redisUrl);
var redisClient = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});

var cluster = require('cluster');
if (!module.parent) {
  if (cluster.isMaster) {
    for (var i = 0; i < require('os').cpus().length; i++) {
      cluster.fork();
    }

    cluster.on('exit', function(worker) {
      console.log('worker ' + worker.process.pid + ' died');
      cluster.fork();
    });
  } else {
    startServer();
  }
}
