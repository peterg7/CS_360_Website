// Require the framework and instantiate it

// ESM
const path = require("path");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
   // Set this to true for detailed logging:
   logger: true
});

// Setup our static files
fastify.register(require("fastify-static"), {
   root: path.join(__dirname, "static"),
   prefix: "/" // optional: default '/'
});

// Run the server!
fastify.listen(3000, (err, address) => {
   if (err) throw err
   // Server is now listening on ${address}
})
