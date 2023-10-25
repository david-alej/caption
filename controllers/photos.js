require("dotenv").config()
const fs = require("fs")
const Sequelize = require("sequelize")
const util = require("util")
const uuidv4 = require("uuid").v4
const unlinkFile = util.promisify(fs.unlink)
const { uploadFile, attachPhotosToResponse } = require("../util/index").s3
const models = require("../database/models")
const { Api400Error, Api403Error, Api404Error, Api500Error } =
  require("../util/index").apiErrors
const { validationPerusal } = require("./validators")

exports.paramPhotoName = async (req, res, next, photoName) => {
  const user = req.session.user
  try {
    const { photoName } = validationPerusal(req, `User: ${user.id}`)

    const searched = await models.Photo.findAll({
      where: { photoName },
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
        `User: ${user.id} photos were not found given photo name ${photoName}.`
      )
    }

    req.photos = searched.dataValues
    next()
  } catch (err) {
    next(err)
  }
}

exports.paramPhotoId = async (req, res, next, photoId) => {
  const user = req.session.user
  try {
    const { photoId } = validationPerusal(req, `User: ${user.id}`)

    const searched = await models.Photo.findOne({
      where: { id: photoId },
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
        `User: ${user.id} photos were not found given photo id ${photoId}.`
      )
    }

    req.photo = searched.dataValues
    next()
  } catch (err) {
    next(err)
  }
}

exports.postPhoto = async (req, res, next) => {
  const user = req.session.user
  const file = req.file
  const fileTitle = req.body.title
  const filename = uuidv4() + ".webp"

  console.log(file)

  const allowedFiles = ["png", "jpeg", "jpg", "gif"]
  const allowedFileTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif"]

  try {
    const { buffer, originalname, mimetype } = file
    const fileExtension = originalname.slice(
      ((originalname.lastIndexOf(".") - 1) >>> 0) + 2
    )

    if (
      !allowedFiles.includes(fileExtension) ||
      !allowedFileTypes.includes(mimetype)
    ) {
      throw new Api400Error(
        `User: ${user.id} tried uploading file that was not an image.`
      )
    }

    const obj = {}

    if (["gif"].includes(fileExtension)) {
      obj.animated = true
    }

    const result = await sharp(buffer, obj)
      .resize({ width: 150 })
      .webp({ lossless: true })
      .toBuffer()
      .then(async (resized) => {
        uploadFile(resized, filename)
      })

    const created = await models.Photo.create({
      userId: user.userId,
      photoName: fileTitle,
      photoFilename: filename,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await unlinkFile(file.path)

    if (!created) {
      throw new Api500Error(`User: ${user.id} update query did not work.`)
    }

    console.log(result)

    res.status(201).json({
      imagePath: `/photos/${fileTitle}`,
      msg: `User: ${user.id} has uploaded a photo.`,
    })
  } catch (err) {
    next(err)
  }
}

exports.getTopPhotos = async (req, res, next) => {
  try {
    const searched = await models.Photo.findAll({
      attributes: {
        include: [
          [Sequelize.fn("SUM", Sequelize.col("captions.votes")), "totalVotes"],
        ],
      },
      include: [
        {
          model: Caption,
          as: "captions",
          attributes: [],
          include: [
            {
              model: User,
              as: "author",
              attributes: { exclude: ["password"] },
            },
          ],
          required: true,
          order: [["votes", "DESC"]],
        },
        {
          model: User,
          as: "author",
          attributes: { exclude: ["password"] },
        },
      ],
      group: ["Photo.id"],
      order: [[Sequelize.col("totalVotes"), "DESC"]],
    })

    if (!searched) {
      throw new Api404Error(`User: ${user.id} top photos were not found.`)
    }

    const photos = searched.dataValues

    attachPhotosToResponse(res, photos)
  } catch (err) {
    next(err)
  }
}

exports.getUserPhotos = async (req, res, next) => {
  const user = req.session.user
  const targetUser = req.user
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

exports.getPhotos = async (req, res, next) => {
  const photos = req.photos

  try {
    attachPhotosToResponse(res, photos)
  } catch (err) {
    next(err)
  }
}

exports.putPhoto = async (req, res, next) => {
  const photo = req.photo
  const user = req.session.user
  try {
    if (photo.userId !== user.id) {
      throw new Api403Error(
        `User: ${user.id} cannot update a photo that does not belong to them.`
      )
    }

    const updatedValues = { photoName: photo.photoName, updatedAt: new Date() }

    const updated = await models.Photo.update(updatedValues, {
      where: { id: photo.id },
    })

    if (!updated) {
      throw new Api500Error(
        `User: ${user.id} update photo name query did not work.`
      )
    }
    res
      .status(204)
      .send(`User: ${user.id} has updated one of their photos name.`)
  } catch (err) {
    next(err)
  }
}

exports.deletePhotos = async (req, res, next) => {
  const photo = req.photo
  const user = req.session.user
  const responseMsg = user.isAdmin
    ? `User: ${user.id} has deleted all of user id ${photos.userId} photos.`
    : `User: ${user.id} has deleted all of their own photos.`
  try {
    if (photo.userId !== user.id || !user.isAdmin) {
      throw new Api403Error(
        `User: ${user.id} cannot delete photos that does not belong to them.`
      )
    }

    const deleted = await models.Photo.destroy({
      where: { userId: user.id },
    })

    if (!deleted) {
      throw new Api500Error(
        `User: ${user.id} delete all photos with user id query did not work.`
      )
    }

    res.status(204).send(responseMsg)
  } catch (err) {
    next(err)
  }
}

exports.deletePhoto = async (req, res, next) => {
  const photo = req.photo
  const user = req.session.user
  const responseMsg = user.isAdmin
    ? `User: ${user.id} has deleted one of user id ${photos.userId} photos.`
    : `User: ${user.id} has deleted one of their own photos.`
  try {
    if (photo.userId !== user.id || !user.isAdmin) {
      throw new Api403Error(
        `User: ${user.id} cannot delete a photo that does not belong to them.`
      )
    }

    const deleted = await models.Photo.destroy({
      where: { id: photo.id },
    })

    if (!deleted) {
      throw new Api500Error(
        `User: ${user.id} delete photo with photo id query did not work.`
      )
    }

    res.status(204).send(responseMsg)
  } catch (err) {
    next(err)
  }
}
