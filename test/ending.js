const { assert, describe, s3, server } = require("./common")

describe("Ending tests", () => {
  after(async function () {
    server.close()
  })

  describe("Deleting all Images in S3", function () {
    it("Checking if images are present in the S3 bucket are only the seeded images ", async function () {
      const expected = true
      const seededS3Images = [
        "a5f8cb21-a34f-4e15-a3a6-d3fe656b1d56.jpg",
        "744fe784-f556-4c68-a81a-2e5d859e27ef.jpg",
        "cc30b9e6-0ae1-4753-86cf-9b81717030c2.jpg",
      ]

      const filenames = await s3.getAllObjectKeys()
      const noNewImagesOnS3 = filenames.every((filename) => {
        return seededS3Images.includes(filename)
      })

      assert.strictEqual(noNewImagesOnS3, expected)
    })

    it("Deleting images, then checking that they where deleted", async function () {
      const expected = 0

      await s3.deleteAllS3Images()
      const filenames = await s3.getAllObjectKeys()
      const numberOfImagesInS3 = filenames ? filenames.length : null

      assert.strictEqual(numberOfImagesInS3, expected)
    })
  })
})
