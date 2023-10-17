const express = require("express")
const session = require("express-session")
const helmet = require("helmet")
const cookieParser = require("cookie-parser")
const { doubleCsrf } = require("csrf-csrf")

const routes = require("../routes/index")
const { htttpLogger } = require("../util/index")

require("dotenv").config()

const app = express()
const { invalidCsrfTokenError, generateToken, doubleCsrfProtection } =
  doubleCsrf({
    getSecret: (req) => req.secret,
    secret: process.env.CSRF_SECRET,
    cookieOptions: { sameSite: "strict", secure: true, signed: true },
  })

app.use(htttpLogger)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  session({
    secret: process.env.COOKIES_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 30,
      secure: true,
      httpOnly: true,
    },
  })
)

app.use(cookieParser(process.env.COOKIES_SECRET)) //process.env.COOKIES_SECRET

app.use(helmet())

app.use("/", routes)

module.exports = app
