require("dotenv").config()
const fs = require("fs")
const S3 = require("aws-sdk/clients/s3")

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

function getFileStream(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName,
  }

  return s3.getObject(downloadParams).createReadStream()
}
exports.getFileStream = getFileStream

const attachPhotosToResponse = (res, photos) => {
  const maxWidth = 750,
    maxHeight = 750

  const form = new FormData()

  for (let i = 0; i < photos.length; i++) {
    const { photoFilename, photoName } = photos[i]

    const readStream = getFileStream(photoFilename)

    const pipeline = sharp()
      .resize(maxWidth, maxHeight)
      .toBuffer()
      .then((resized) => {
        const stream = Readable.from(resized)
        form.append(photoName, stream, photoFilename)
        form.append(photoName + " - information", JSON.stringify(photos[i]))
      })

    readStream.pipe(pipeline)
  }

  res.setHeader(
    "X-Content-Type",
    "multipart/form-data; boundary=" + form._boundary
  )

  res.setHeader("Content-Type", "text/plain")

  form.pipe(res)
}

exports.attachPhotosToResponse = attachPhotosToResponse
