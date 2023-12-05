require("dotenv").config()
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3")

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

const getFileStream = async (fileKey) => {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName,
  }

  const command = new GetObjectCommand(downloadParams)

  return await client.send(command)
}

exports.getFileStream = getFileStream

const getAllObjectKeys = async () => {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
  })

  try {
    let isTruncated = true
    let keys = []

    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } =
        await client.send(command)

      if (Contents) {
        Contents.map((c) => keys.push(c.Key))
      }

      isTruncated = IsTruncated

      command.input.ContinuationToken = NextContinuationToken
    }

    return keys
  } catch (err) {
    console.error(err)

    return null
  }
}

exports.getAllObjectKeys = getAllObjectKeys

const uploadFile = async (buffer, filename) => {
  const uploadParams = {
    Bucket: bucketName,
    Body: buffer,
    Key: filename,
  }

  const command = new PutObjectCommand(uploadParams)

  return await client.send(command)
}

exports.uploadFile = uploadFile

const deleteFile = async (fileKey) => {
  const deleteParams = {
    Key: fileKey,
    Bucket: bucketName,
  }

  const command = new DeleteObjectCommand(deleteParams)

  const response = await client.send(command)

  return response.$metadata
}

exports.deleteFile = deleteFile
