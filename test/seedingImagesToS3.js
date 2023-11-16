const { assert, describe, models, s3 } = require("./common")

describe("Seeding Images to S3", function () {
  this.timeout(7 * 1000)

  it("Seeding images to s3, then checking that they exist in s3 ", async function () {
    const searched = await models.Photo.findAll()
    const filenames = JSON.parse(JSON.stringify(searched)).map((photo) => {
      return photo.filename
    })
    const notExpected = null
    const photosFromS3 = []

    await s3.seedS3Images()
    for (const filename of filenames) {
      const photo = await s3.getObjectData(filename)
      photosFromS3.push(photo)
    }

    for (const photo of photosFromS3) {
      assert.notStrictEqual(photo, notExpected)
    }
  })
})
