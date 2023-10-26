const { validationPerusal } = require("./validators")
const models = require("../database/models")
const { Api500Error } = require("../util/index").apiErrors

exports.postCaption = async (req, res, next) => {
  const user = req.session.user
  const preErrorMsg = `User: ${user.id}`

  try {
    const { photoId, captionText } = validationPerusal(req, preErrorMsg)

    const values = {
      userId: user.id,
      photoId,
      captionText,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const created = models.Caption.create(values)

    if (!created) {
      throw new Api500Error(`User: ${user.id} create query did not work.`)
    }

    res.status(201).send(`User: ${user.id} caption has been created.`)
  } catch (err) {
    next(err)
  }
}

exports.getCaptions = async (req, res, next) => {}

exports.getCaption = async (req, res, next) => {}

exports.putCaption = async (req, res, next) => {}

exports.deleteCaptions = async (req, res, next) => {}

exports.deleteCaption = async (req, res, next) => {}
