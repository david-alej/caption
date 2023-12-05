const { seedS3Images, deleteAllS3Images } = require("./helpers")

const seed = async () => {
  await deleteAllS3Images()

  console.log("\nAll images where deleted from the S3 bucket.\n")

  await seedS3Images()

  console.log("\nImages are seeded into the S3 bucket.")
}

seed()
