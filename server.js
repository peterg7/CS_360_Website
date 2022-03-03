// Require the framework and instantiate it

// ESM
// const path = require("path");

// // Require the fastify framework and instantiate it
// const fastify = require("fastify")({
//    // Set this to true for detailed logging:
//    logger: true
// });

// // Setup our static files
// fastify.register(require("fastify-static"), {
//    root: path.join(__dirname, "static"),
//    prefix: "/" // optional: default '/'
// });

// // Run the server!
// fastify.listen(5000, (err, address) => {
//    if (err) throw err
//    // Server is now listening on ${address}
// })


const express = require("express")
const path = require("path")

const app = express()

app.use(
  "/css",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/css"))
)
app.use(
  "/js",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/js"))
)
app.use("/js", express.static(path.join(__dirname, "node_modules/jquery/dist")))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "static/index.html"))
})

app.listen(5000, () => {
  console.log("Listening on port " + 5000)
})