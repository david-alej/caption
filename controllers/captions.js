const { validationPerusal, integerValidator } = require("./validators")
const models = require("../database/models")
const { Api401Error, Api403Error, Api404Error, Api500Error } =
  require("../util/index").apiErrors
const { selfSearch, whereSearch, inputsToSearch } =
  require("../util/index").search

const otherOptions = {
  include: [
    {
      model: models.User,
      as: "author",
      attributes: { exclude: ["password"] },
    },
  ],
  order: [["votes", "DESC"]],
}

const topCaptionsSearch = {
  ...otherOptions,
  limit: 10,
}

exports.paramCaptionId = async (req, res, next, captionId) => {
  const user = req.session.user

  try {
    await integerValidator("captionId", true).run(req)

    validationPerusal(req, `User: ${user.id}`)

    const searchParams = whereSearch({ id: captionId }, otherOptions)

    const searched = await models.Caption.findOne(searchParams)

    if (!searched) {
      throw new Api404Error(
        `User: ${user.id} caption was not found given caption id ${captionId}.`
      )
    }

    req.caption = searched.dataValues

    next()
  } catch (err) {
    next(err)
  }
}

exports.postCaption = async (req, res, next) => {
  const user = req.session.user
  const preErrorMsg = `User: ${user.id}`

  try {
    validationPerusal(req, preErrorMsg)

    const { photoId, text } = req.body

    const values = {
      userId: user.id,
      photoId,
      text,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const created = await models.Caption.create(values)

    if (!created) {
      throw new Api500Error(`User: ${user.id} create query did not work.`)
    }

    res.status(201).send(`User: ${user.id} caption has been created.`)
  } catch (err) {
    next(err)
  }
}

exports.getCaptions = async (req, res, next) => {
  const user = req.session.user
  const preErrorMsg = `User: ${user.id}`

  try {
    validationPerusal(req, preErrorMsg)

    const { afterMsg, searchParams } = inputsToSearch(
      req,
      topCaptionsSearch,
      otherOptions,
      "caption"
    )

    const searched = await models.Caption.findAll(searchParams)

    if (!searched) {
      throw new Api401Error(
        `User: ${user.id} captions were not found ` + afterMsg
      )
    }

    res.json(searched)
  } catch (err) {
    next(err)
  }
}

exports.getCaption = async (req, res, next) => {
  const caption = req.caption

  try {
    res.json(caption)
  } catch (err) {
    next(err)
  }
}

exports.putCaption = async (req, res, next) => {
  const user = req.session.user
  const caption = req.caption
  const { text } = req.body

  try {
    if (caption.userId !== user.id) {
      throw new Api403Error(
        `User: ${user.id} cannot update a caption that does not belong to them.`
      )
    }

    const updatedValues = { text, updatedAt: new Date() }

    const updated = await models.Caption.update(updatedValues, {
      where: { id: caption.id },
    })

    if (!updated) {
      throw new Api500Error(
        `User: ${user.id} update caption text query did not work.`
      )
    }

    res.send(
      `User: ${user.id} has updated one of their caption with id ${caption.id}.`
    )
  } catch (err) {
    next(err)
  }
}

exports.deleteCaptions = async (req, res, next) => {
  const user = req.session.user
  const preErrorMsg = `User: ${user.id}`
  const targetIsSelf = user.isAdmin
    ? user.id === req.body.userId
    : req.body.userId === undefined || user.id === req.body.userId
  const responseMsg = targetIsSelf
    ? `User: ${user.id} has deleted all of their own captions associated`
    : `User: ${user.id} has deleted all of the captions associated`

  try {
    if (!targetIsSelf && !user.isAdmin) {
      throw new Api403Error(
        `User: ${user.id} cannot delete photos that does not belong to them.`
      )
    }

    validationPerusal(req, preErrorMsg)

    const { afterMsg, searchParams } = inputsToSearch(
      req,
      selfSearch(user.id),
      otherOptions,
      "caption"
    )

    const deleted = await models.Caption.destroy(searchParams)

    if (!deleted) {
      throw new Api500Error(
        `User: ${user.id} delete photos query did not work ` + afterMsg
      )
    }

    res.send(responseMsg + afterMsg)
  } catch (err) {
    next(err)
  }
}

exports.deleteCaption = async (req, res, next) => {
  const caption = req.caption
  const user = req.session.user
  const targetIsSelf = caption.userId === user.id
  const responseMsg = targetIsSelf
    ? `User: ${user.id} has deleted one of their own captions.`
    : `User: ${user.id} has deleted one of user id ${caption.userId} captions.`

  try {
    if (!targetIsSelf && !user.isAdmin) {
      throw new Api403Error(
        `User: ${user.id} cannot delete a caption that does not belong to them.`
      )
    }

    const deleted = await models.Caption.destroy({
      where: { id: caption.id },
    })

    if (!deleted) {
      throw new Api500Error(
        `User: ${user.id} delete caption with caption id query did not work.`
      )
    }

    res.send(responseMsg)
  } catch (err) {
    next(err)
  }
}
