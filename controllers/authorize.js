const { Api400Error } = require("../util/index").apiErrors

exports.authorizedUser = (req, res, next) => {
  if (req.session.authorized) {
    next()
    return
  }
  throw new Api400Error("Client needs to login to view this page.")
}
