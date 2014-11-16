var Hapi = require('hapi');
var Promise = require('bluebird');
var routes = require('./routes');

function startServer() {
  var server = new Hapi.Server('0.0.0.0', process.env.PORT || 8000);
  Promise.all([
    mongoClient.connectAsync(mongoUrl),
    redisClient.authAsync(redisURL.auth.split(':')[1])
  ]).then(function (results) {
    routes(server, results[0], redisClient);
    server.start();
  });
}

var url = require('url');
var mongo = require('mongodb');
var mongoClient = mongo.MongoClient;
var collection  = mongo.Collection;
var redis = require('redis');

// Promisify everything. Bluebird adds *Async function which return promises.
Promise.promisifyAll(collection.prototype);
Promise.promisifyAll(mongoClient);
Promise.promisifyAll(mongo.Cursor.prototype);
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

// Allow unhandled exceptions to be caught by Hapi for proper 500 errors.
Promise.onPossiblyUnhandledRejection(function(e) { throw e; });

var mongoUrl = process.env.MONGO_URL || '';
var redisURL = url.parse(process.env.REDISCLOUD_URL || '');
var redisClient = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});

var cluster = require('cluster');
if (cluster.isMaster) {
  for (var i = 0; i < require('os').cpus().length; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker) {
    console.log('worker ', worker.process.pid, ' died');
    cluster.fork();
  });
} else {
  startServer();
}
