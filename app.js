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

        console.log(
          `Swagger-ui is available on https://localhost:${
            server.address().port
          }/api-docs`
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

if (process.env.NODE_ENV !== "test") initializeWebServer()

module.exports = { initializeWebServer, stopWebServer, privateCertificate }
