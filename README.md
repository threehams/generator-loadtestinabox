# generator-loadtestinabox

Compare code performance under real-world conditions using free Heroku servers and add-ons.

## Getting started
* `npm install -g generator-loadtestinabox`
* Create an account on http://www.heroku.com
* `yo loadtestinabox`
* Follow the prompts!

###Heroku - Verified or unverified account
If your account is verified with a credit card, this will just work!
If you aren't willing

## Why
Performance-testing tools, like the fantastic jsperf, tell you which code is faster.
loadtestinabox tells you which code is faster under real-world conditions.

## Stack
* node.js, because of incredible throughput, especially on free / extremely cheap hosting.
* Heroku, because the free dyno and addons make this sort of generator possible.
* Hapi.js, because it's a very fast server designed for APIs, with all the unimportant bits stripped out.
* Loader.io, because the free version supports 10,000 concurrent connections, enough to max out
  CPU for a single-node Heroku server with an I/O call.
* cluster to use all available threads on a Heroku dyno (currently 4).

## Available Databases
* MongoDB through Compose MongoHQ - Good throughput for a free service, capable of making the CPU the bottleneck (512MB max).
* Redis through RedisCloud - Most space available, basically the only Redis option for tests involving writes (25MB max).

## Future Releases
* IronCache, MemCachier, Treasure Data or GrapheneDB for possibly faster I/O with more space.
