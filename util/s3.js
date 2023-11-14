/* eslint-disable security/detect-non-literal-fs-filename */
require("dotenv").config()
const S3 = require("aws-sdk/clients/s3")
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const FormData = require("form-data")
const util = require("util")
const { pipeline } = require("stream/promises")
const models = require("../database/models")
const unlinkFile = util.promisify(fs.unlink)

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
})

function uploadFile(buffer, filename) {
  const uploadParams = {
    Bucket: bucketName,
    Body: buffer,
    Key: filename,
  }

  return s3.upload(uploadParams).promise()
}
exports.uploadFile = uploadFile

const getObjectData = async (fileKey) => {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName,
  }
  try {
    const data = await s3.getObject(downloadParams).promise()

    return data.Body.toString("utf-8")
  } catch (err) {
    return null
  }
}

exports.getObjectData = getObjectData

function getFileStream(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName,
  }

  return s3.getObject(downloadParams).createReadStream()
}
exports.getFileStream = getFileStream

const attachFilesToResponse = async (res, photos) => {
  const maxWidth = 750,
    maxHeight = 750

  const form = new FormData()

  for (let i = 0; i < photos.length; i++) {
    const { filename, title } = photos[parseInt(i)]
    const filePath = path.join("./public/img/temp", filename)

    fs.writeFileSync(filePath, "")

    const file = fs.createWriteStream(filePath)

    await pipeline(getFileStream(filename), file)

    const buffer = fs.readFileSync(filePath, { encoding: "" })

    await sharp(buffer)
      .resize(maxWidth, maxHeight)
      .webp({ lossless: true })
      .toBuffer()
      .then((resized) => {
        form.append(title, resized, filename)
        form.append(
          title + " - information",
          JSON.stringify(photos[parseInt(i)])
        )
      })

    await unlinkFile(filePath)
  }

  res.setHeader(
    "X-Content-Type",
    "multipart/form-data; boundary=" + form._boundary
  )

  res.setHeader("Content-Type", "text/plain")

  form.pipe(res)
}

exports.attachFilesToResponse = attachFilesToResponse

const deleteFile = (fileKey) => {
  const deleteParams = {
    Key: fileKey,
    Bucket: bucketName,
  }
  return s3.deleteObject(deleteParams).promise()
}

exports.deleteFile = deleteFile

const seedS3Images = async () => {
  const baseDirectory = "./public/img/seeds"

  const files = await fs.promises.readdir(baseDirectory)

  for (const filename of files) {
    const data = await getObjectData(filename)

    if (data) {
      console.log(filename, "exists already in S3.")
      continue
    }
    const filePath = path.join(baseDirectory, filename)

    const fileExtension = filename.slice(
      ((filename.lastIndexOf(".") - 1) >>> 0) + 2
    )

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const buffer = await fs.readFileSync(filePath)

    const sharpInput = [buffer]

    if (["gif"].includes(fileExtension)) {
      sharpInput.push({ animated: true })
    }

    await sharp(...sharpInput)
      .resize({ width: 150 })
      .webp({ lossless: true })
      .toBuffer()
      .then(async (resized) => {
        uploadFile(resized, filename)
      })
  }
}

exports.seedS3Images = seedS3Images

const deleteAllS3Images = async () => {
  const searched = await models.Photo.findAll()

  const photos = JSON.parse(JSON.stringify(searched))

  for (const photo of photos) {
    await deleteFile(photo.filename)
  }
}

exports.deleteAllS3Images = deleteAllS3Images
