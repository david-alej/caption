const { doubleCsrf } = require("csrf-csrf")
require("dotenv").config()

const { invalidCsrfTokenError, generateToken, doubleCsrfProtection } =
  doubleCsrf({
    getSecret: (req) => req.secret,
    secret: process.env.CSRF_SECRET,
    cookieOptions: {
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production", //set this like this becuase the app I am munually testing endpoints on can only save the cookies if they are secure
      signed: true,
      maxAge: 1000 * 60 * 30,
    },
  })
console.log("secure cookies: ", process.env.NODE_ENV === "production")
module.exports = {
  invalidCsrfTokenError,
  generateToken,
  doubleCsrfProtection,
}
