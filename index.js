var express = require("express");
var redis = require("redis");
var app = express();

// Serve static files from the public directory
app.use(express.static("public"));

// Create a Redis client
var client = redis.createClient();

client.on("error", function (err) {
  console.log("Error " + err);
});

// Connect to Redis
client.connect().then(() => {
  console.log("Connected to Redis");

  // Initialize values for: header, left, right, article, and footer using the Redis client
  client.multi()
    .set("header", 0)
    .set("left", 0)
    .set("article", 0)
    .set("right", 0)
    .set("footer", 0)
    .exec(function (err, replies) {
      if (err) {
        console.log("Error setting initial values: " + err);
      } else {
        console.log("Initial values set.");
      }
    });

  // Get values for holy grail layout
  function data() {
    return new Promise((resolve, reject) => {
      client.mget(["header", "left", "article", "right", "footer"], function (err, values) {
        if (err) {
          reject(err);
        } else {
          resolve({
            header: values[0],
            left: values[1],
            article: values[2],
            right: values[3],
            footer: values[4]
          });
        }
      });
    });
  }

  // Update key-value pair
  app.get("/update/:key/:value", function (req, res) {
    const key = req.params.key;
    let value = Number(req.params.value);

    client.set(key, value, function (err, reply) {
      if (err) {
        res.status(500).send(err);
        return;
      }

      data().then((data) => {
        res.send(data);
      }).catch((err) => {
        res.status(500).send(err);
      });
    });
  });

  // Get key data
  app.get("/data", function (req, res) {
    data().then((data) => {
      res.send(data);
    }).catch((err) => {
      res.status(500).send(err);
    });
  });

  app.listen(3000, () => {
    console.log("Running on 3000");
  });

  process.on("exit", function () {
    client.quit();
  });
}).catch(err => {
  console.log("Failed to connect to Redis: " + err);
});
