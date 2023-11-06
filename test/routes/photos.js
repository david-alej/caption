const {
  app,
  assert,
  describe,
  httpStatusCodes,
  models,
  seedersDirectory,
  session,
} = require("../common")
const { seedS3Images, deleteAllS3Images } = require("../../util/s3")

// eslint-disable-next-line security/detect-non-literal-require
const usersSeeder = require(seedersDirectory + "/20231027225905-User")
// eslint-disable-next-line security/detect-non-literal-require
const photosSeeder = require(seedersDirectory + "/20231027225911-Photo.js")

const { OK, CREATED } = httpStatusCodes

describe("Photos route", () => {
  const userCredentials = {
    username: "username",
    password: "Password1",
  }
  const adminCredentials = {
    username: "yomaster",
    password: "yoyoyo1Q",
  }

  let userSession = ""
  let csrfToken = ""

  before(async function () {
    this.timeout(4000)

    // await usersSeeder.up(models.sequelize.getQueryInterface(), null)

    // await photosSeeder.up(models.sequelize.getQueryInterface(), null)

    // await seedS3Images()

    userSession = session(app)

    await userSession.post("/register").send(userCredentials).expect(CREATED)

    const loginResponse = await userSession
      .post("/login")
      .send(userCredentials)
      .expect(OK)

    csrfToken = JSON.parse(loginResponse.text).csrfToken
  })

  // after(async function () {
  //   this.timeout(4000)

  //   await deleteAllS3Images()

  //   await models.User.destroy({ truncate: true })

  //   await models.Photo.destroy({ truncate: true })
  // })

  describe("Get /", () => {
    it("When request is made with credentials and csrf token, then all the photos are returned", async function () {
      const expected = []
      const requestBody = {
        username: "rina.dark",
      }

      const response = await userSession
        .get("/photos/")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })
  })
})
