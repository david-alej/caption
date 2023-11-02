const { doubleCsrf } = require("csrf-csrf")
require("dotenv").config()

const { invalidCsrfTokenError, generateToken, doubleCsrfProtection } =
  doubleCsrf({
    getSecret: (req) => req.secret,
    secret: process.env.CSRF_SECRET,
    cookieOptions: {
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      signed: true,
      maxAge: 1000 * 60 * 10,
    },
  })

module.exports = {
  invalidCsrfTokenError,
  generateToken,
  doubleCsrfProtection,
}
