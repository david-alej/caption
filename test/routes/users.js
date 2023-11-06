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
const usersSeeder = require(seedersDirectory + "/20231027225905-User")
const { OK, CREATED, NOT_FOUND, BAD_REQUEST, FORBIDDEN } = httpStatusCodes

describe("Users route", () => {
  const userCredentials = {
    username: "username",
    password: "Password1",
  }
  const adminCredentials = {
    username: "yomaster",
    password: "yoyoyo1Q",
  }

  before(async function () {
    await usersSeeder.up(models.sequelize.getQueryInterface(), null)
  })

  after(async function () {
    await models.User.destroy({ truncate: true })
  })

  describe("Get /", () => {
    it("When an authorized request is made, then all the users are in the response", async function () {
      const expected = [
        {
          username: "username",
          isAdmin: false,
        },
        {
          id: 4,
          username: "yomaster",
          isAdmin: true,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
        {
          id: 3,
          username: "penguinlover",
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
        {
          id: 2,
          username: "Carkeys23307",
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
        {
          id: 1,
          username: "rina.dark",
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
      ]
      const userSession = session(app)
      await userSession.post("/register").send(userCredentials).expect(CREATED)
      await userSession.post("/login").send(userCredentials).expect(OK)

      const response = await userSession.get("/users")

      await models.User.destroy({ where: { username: "username" } })

      assert.strictEqual(response.status, OK)
      for (let i = 0; i < expected.length; i++) {
        assert.include(
          JSON.parse(response.text)[parseInt(i)],
          expected[parseInt(i)]
        )
      }
    })
  })

  describe("Get /:username", () => {
    it("When given username does not exist in the database, then the response is a not found message #paramUsername", async function () {
      const expected = "Not found."
      const usernameSearch = "nonExisitngUsername"
      const userSession = session(app)
      await userSession.post("/register").send(userCredentials).expect(CREATED)
      await userSession.post("/login").send(userCredentials).expect(OK)

      const response = await userSession.get("/users/" + usernameSearch)

      await models.User.destroy({ where: { username: "username" } })

      assert.strictEqual(response.status, NOT_FOUND)
      assert.include(response.text, expected)
    })

    it("When given username does exist in the database, then the user is in the response", async function () {
      const usernameSearch = "penguinlover"
      const expected = {
        username: usernameSearch,
        isAdmin: false,
        createdAt: "2023-11-02T20:00:00.000Z",
        updatedAt: "2023-11-02T20:00:00.000Z",
      }
      const userSession = session(app)
      await userSession.post("/register").send(userCredentials).expect(CREATED)
      await userSession.post("/login").send(userCredentials).expect(OK)

      const response = await userSession.get("/users/" + usernameSearch)

      await models.User.destroy({ where: { username: "username" } })

      assert.strictEqual(response.status, OK)
      assert.include(JSON.parse(response.text), expected)
    })
  })

  describe("Put /", () => {
    it("When no new credentials are added, then response is a bad request", async function () {
      const requestBody = userCredentials
      const expected = "Bad request."
      const userSession = session(app)
      await userSession.post("/register").send(userCredentials).expect(CREATED)
      const loginResponse = await userSession
        .post("/login")
        .send(userCredentials)
        .expect(OK)
      const csrfToken = JSON.parse(loginResponse.text).csrfToken

      const response = await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      await models.User.destroy({ where: { username: "username" } })

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When a new username is entered but it already exists, then response is a bad request", async function () {
      const requestBody = { ...userCredentials, newUsername: "penguinlover" }
      const expected = "Bad request."
      const userSession = session(app)
      await userSession.post("/register").send(userCredentials).expect(CREATED)
      const loginResponse = await userSession
        .post("/login")
        .send(userCredentials)
        .expect(OK)
      const csrfToken = JSON.parse(loginResponse.text).csrfToken

      const response = await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      await models.User.destroy({ where: { username: "username" } })

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When a valid new username is provided, then response is ok", async function () {
      const newUsername = "Username"
      const requestBody = { ...userCredentials, newUsername }
      const expectedOne = "User: "
      const expectedTwo = " has updated either/both their username or password."
      const userSession = session(app)
      await userSession.post("/register").send(userCredentials).expect(CREATED)
      const loginResponse = await userSession
        .post("/login")
        .send(userCredentials)
        .expect(OK)
      const csrfToken = JSON.parse(loginResponse.text).csrfToken

      const response = await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      await models.User.destroy({ where: { username: newUsername } })

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expectedOne)
      assert.include(response.text, expectedTwo)
    })

    it("When a valid new password is provided, then response is ok", async function () {
      const requestBody = { ...userCredentials, newPassword: "Password2" }
      const expectedOne = "User: "
      const expectedTwo = " has updated either/both their username or password."
      const userSession = session(app)
      await userSession.post("/register").send(userCredentials).expect(CREATED)
      const loginResponse = await userSession
        .post("/login")
        .send(userCredentials)
        .expect(OK)
      const csrfToken = JSON.parse(loginResponse.text).csrfToken

      const response = await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      await models.User.destroy({ where: { username: "username" } })

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expectedOne)
      assert.include(response.text, expectedTwo)
    })

    it("When both new credentiald are added and valid, then response is ok", async function () {
      const newUsername = "Username"
      const requestBody = {
        ...userCredentials,
        newUsername,
        newPassword: "Password2",
      }
      const expectedOne = "User: "
      const expectedTwo = " has updated either/both their username or password."
      const userSession = session(app)
      await userSession.post("/register").send(userCredentials).expect(CREATED)
      const loginResponse = await userSession
        .post("/login")
        .send(userCredentials)
        .expect(OK)
      const csrfToken = JSON.parse(loginResponse.text).csrfToken

      const response = await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      await models.User.destroy({ where: { username: newUsername } })

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expectedOne)
      assert.include(response.text, expectedTwo)
    })
  })

  describe("Delete /:username", () => {
    it("When regular user tries to delete other user, then response is forbidden", async function () {
      const expected = "Forbidden."
      const usernameSearch = "rina.dark"
      const userSession = session(app)
      await userSession.post("/register").send(userCredentials).expect(CREATED)
      const loginResponse = await userSession
        .post("/login")
        .send(userCredentials)
        .expect(OK)
      const csrfToken = JSON.parse(loginResponse.text).csrfToken

      const response = await userSession
        .delete("/users/" + usernameSearch)
        .set("x-csrf-token", csrfToken)

      await models.User.destroy({ where: { username: "username" } })

      assert.strictEqual(response.status, FORBIDDEN)
      assert.include(response.text, expected)
    })

    it("When username given is the logged in user, then user is deleted with a response message", async function () {
      const expected = " has deleted their own account."
      const usernameSearch = "username"
      const userSession = session(app)
      await userSession.post("/register").send(userCredentials).expect(CREATED)
      const loginResponse = await userSession
        .post("/login")
        .send(userCredentials)
        .expect(OK)
      const csrfToken = JSON.parse(loginResponse.text).csrfToken

      const response = await userSession
        .delete("/users/" + usernameSearch)
        .set("x-csrf-token", csrfToken)
        .send(userCredentials)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })

    it("When admin inputs username to delete another user, then user is deleted with a response message", async function () {
      const expected = " has deleted user"
      const usernameSearch = "username"
      const adminSession = session(app)
      await request(app).post("/register").send(userCredentials).expect(CREATED)
      const loginResponse = await adminSession
        .post("/login")
        .send(adminCredentials)
        .expect(OK)
      const csrfToken = JSON.parse(loginResponse.text).csrfToken

      const response = await adminSession
        .delete("/users/" + usernameSearch)
        .set("x-csrf-token", csrfToken)
        .send(adminCredentials)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })
  })
})
