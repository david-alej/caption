const {
  app,
  assert,
  describe,
  httpStatusCodes,
  models,
  request,
  seedersDirectory,
  session,
} = require("../common")

// eslint-disable-next-line security/detect-non-literal-require
const userSeeder = require(seedersDirectory + "/20231027225905-User")
console.log(userSeeder)
const { OK, CREATED } = httpStatusCodes

describe("Users route", () => {
  describe("Get /", () => {
    it("When an authorized request is made, then all the users are in the response.", async function () {
      const expected = [
        {
          id: 4,
          username: "yomaster",
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
          photos: [],
        },
        {
          id: 3,
          username: "penguinlover",
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
          photos: [],
        },
        {
          id: 2,
          username: "Carkeys23307",
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
          photos: [],
        },
        {
          id: 1,
          username: "rina.dark",
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
          photos: [],
        },
      ]
      const credentials = {
        username: "username1",
        password: "Password1",
      }
      await userSeeder.up(models.sequelize.getQueryInterface(), null)
      const userSession = session(app)
      await userSession.post("/register").send(credentials).expect(CREATED)
      await userSession.post("/login").send(credentials).expect(OK)

      const response = await userSession.get("/users")
      console.log(response.text, expected)
      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)

      models.User.destroy({ truncate: true })
    })
  })

  describe("Get /:username", () => {
    it("When an authorized request is made, then all the users are in the response.", async function () {
      const expected = [
        {
          id: 5,
          username: "username1",
          isAdmin: false,
          createdAt: "2023-11-02T23:36:12.370Z",
          updatedAt: "2023-11-02T23:36:12.371Z",
          photos: [],
        },
      ]
      const credentials = {
        username: "username1",
        password: "Password1",
      }
      await userSeeder.up(models.sequelize.getQueryInterface(), null)
      const userSession = session(app)
      await userSession.post("/register").send(credentials).expect(CREATED)
      await userSession.post("/login").send(credentials).expect(OK)

      const response = await userSession.get("/users/").send()
      console.log(response.text, "\n")
      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)

      models.User.destroy({ truncate: true })
    })
  })
})
