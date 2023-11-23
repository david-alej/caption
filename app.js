const app = require("./server")
const https = require("https")
const fs = require("fs")
const privateKey = fs.readFileSync("key.pem")
const privateCertificate = fs.readFileSync("cert.pem")

require("dotenv").config()

let server = ""

const initializeWebServer = () => {
  return new Promise((resolve) => {
    const PORT = process.env.PORT || 3300

    // app.set("trust proxy", 1)

    server = https
      .createServer(
        {
          key: privateKey,
          cert: privateCertificate,
        },
        app
      )
      .listen(PORT, () => {
        console.log(
          `Server is live at https://localhost:${server.address().port}`
        )

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

module.exports = { initializeWebServer, stopWebServer, privateCertificate }
