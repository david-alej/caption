const models = require("../database/models")
const { paramUsername } = require("./users")
const { attachPhotosToResponse, deleteFile } = require("../util/index").s3
const { Api403Error, Api404Error, Api500Error } =
  require("../util/index").apiErrors

exports.paramUsername = paramUsername

exports.getUserPhotos = async (req, res, next) => {
  const user = req.session.user
  const targetUser = req.targetUser
  try {
    const searched = await models.Photo.findAll({
      where: { userId: targetUser.id },
      include: [
        {
          model: models.Caption,
          as: "captions",
          order: [["votes", "DESC"]],
          include: [
            {
              model: models.User,
              as: "author",
              attributes: { exclude: ["password"] },
            },
          ],
        },
        {
          model: models.User,
          as: "author",
          attributes: { exclude: ["password"] },
        },
      ],
    })

    if (!searched) {
      throw new Api404Error(
        `User: ${user.id} photos were not found given user with id ${targetUser.id}.`
      )
    }

    const photos = searched.dataValues

    attachPhotosToResponse(res, photos)
  } catch (err) {
    next(err)
  }
}

exports.deleteUserPhotos = async (req, res, next) => {
  const user = req.session.user
  const targetUser = req.targetUser
  const targetIsSelf = user.id === targetUser.id
  const responseMsg = targetIsSelf
    ? `User: ${user.id} has deleted all of their own photos.`
    : `User: ${user.id} has deleted all of the photos of a user with id ${targetUser.id}.`
  try {
    if (!targetIsSelf || !user.isAdmin) {
      throw new Api403Error(
        `User: ${user.id} cannot delete photos that does not belong to them.`
      )
    }

    const deleted = await models.Photo.destroy({
      where: { userId: targetUser.id },
    })

    if (!deleted) {
      throw new Api500Error(
        `User: ${user.id} delete photo with photo id query did not work.`
      )
    }

    const { photoFilename } = deleted.dataValues

    await deleteFile(photoFilename)

    res.status(204).send(responseMsg)
  } catch (err) {
    next(err)
  }
}
