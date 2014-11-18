var Promise = require('bluebird');

function loop(iterations) {
  iterations = iterations || 0;

  return Promise.delay(1000).then(function () {
    if (iterations === 10) return true;
    console.log(iterations);
    loop(iterations + 1);
  });
}

Promise.resolve().then(loop);