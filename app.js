const app = require("./server")
const https = require("https")
const fs = require("fs")
const privateKey = fs.readFileSync("key.pem")
const privateCertificate = fs.readFileSync("cert.pem")

require("dotenv").config()

let server = ""

const initializeWebServer = () => {
  return new Promise((resolve) => {
    const PORT = process.env.PORT || 0

    // app.set("trust proxy", 1)

    const server = https.createServer(
      {
        key: privateKey,
        cert: privateCertificate,
      },
      app
    )

    server.listen(PORT, () => {
      console.log(`Server is live at https://localhost:${PORT}`)
      resolve(server.address())
    })
  })
}

const stopWebServer = () => {
  return new Promise((resolve) => {
    server.close(() => {
      resolve()
    })
  })
}

module.exports = { initializeWebServer, stopWebServer }
