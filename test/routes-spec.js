var Lab = require("lab"),
  server = require("../server.js");
Lab.experiment("routes", function() {
  Lab.test("returns 200 with correct parameters", function(done) {
    server.inject({
      method: "GET",
      url: "/route1"
    }, function(response) {
      Lab.expect(response.statusCode).to.equal(200);

      done();
    });
  });

  Lab.test("returns 200 with correct parameters", function(done) {
    server.inject({
      method: "GET",
      url: "/route2"
    }, function(response) {
      Lab.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});