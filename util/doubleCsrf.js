const { doubleCsrf } = require("csrf-csrf")

const { invalidCsrfTokenError, generateToken, doubleCsrfProtection } =
  doubleCsrf({
    getSecret: (req) => req.secret,
    secret: process.env.CSRF_SECRET,
    cookieOptions: { sameSite: "strict", secure: true, signed: true },
  })

module.exports = {
  invalidCsrfTokenError,
  generateToken,
  doubleCsrfProtection,
}
