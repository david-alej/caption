const { Api401Error } = require("../util/index").apiErrors

exports.authorizedUser = (req, res, next) => {
  if (req.session.authorized) {
    res.next()
    return
  }
  throw new Api401Error("Client needs to login to view this page.")
}
