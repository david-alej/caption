const app = require("./server")
const https = require("https")
const fs = require("fs")
const privateKey = fs.readFileSync("key.pem")
const privateCertificate = fs.readFileSync("cert.pem")

require("dotenv").config()

const PORT = process.env.PORT || 3300

app.set("trust proxy", 1)

https
  .createServer(
    {
      key: privateKey,
      cert: privateCertificate,
    },
    app
  )
  .listen(PORT, () => {
    console.log(`Server is live at https://localhost:${PORT}`)
  })

// app.listen(PORT, () => {
//   console.log(`Server is live at http://localhost:${PORT}`)
// })
