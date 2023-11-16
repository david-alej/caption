const {
  app,
  assert,
  describe,
  httpStatusCodes,
  models,
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
  let userSession = ""
  let csrfToken = ""

  before(async function () {
    await usersSeeder.up(models.sequelize.getQueryInterface(), null)

    userSession = session(app)

    await userSession.post("/register").send(userCredentials).expect(CREATED)

    const loginResponse = await userSession
      .post("/login")
      .send(userCredentials)
      .expect(OK)

    csrfToken = JSON.parse(loginResponse.text).csrfToken
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

      const response = await userSession.get("/users")

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
    it("When given username is invalid, then the response is bad request #usernameValidator #paramUsername", async function () {
      const expected = "Bad request."
      const usernameSearch = "usernam e"

      const response = await userSession.get("/users/" + usernameSearch)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.include(response.text, expected)
    })

    it("When given username does not exist in the database, then the response is a not found message #paramUsername", async function () {
      const expected = "Not found."
      const usernameSearch = "nonExisitngUsername"

      const response = await userSession.get("/users/" + usernameSearch)

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

      const response = await userSession.get("/users/" + usernameSearch)

      assert.strictEqual(response.status, OK)
      assert.include(JSON.parse(response.text), expected)
    })
  })

  describe("Put /", () => {
    const userNewCredentials = {
      newUsername: "username1",
      newPassword: "Password1",
    }

    it("When no new credentials are added, then response is a bad request", async function () {
      const requestBody = userCredentials
      const expected = "Bad request."

      const response = await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When a new username is entered but it already exists, then response is a bad request", async function () {
      const requestBody = { ...userCredentials, newUsername: "penguinlover" }
      const expected = "Bad request."

      const response = await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When a valid new username is provided, then response is ok", async function () {
      const { username, password } = userCredentials
      const { newUsername } = userNewCredentials
      const requestBody = { ...userCredentials, newUsername }
      const teardownRequestBody = {
        username: newUsername,
        password,
        newUsername: username,
      }
      const expectedOne = "User: "
      const expectedTwo = " has updated either/both their username or password."

      const response = await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expectedOne)
      assert.include(response.text, expectedTwo)

      await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(teardownRequestBody)
        .expect(OK)
    })

    it("When a valid new password is provided, then response is ok", async function () {
      const { username, password } = userCredentials
      const { newPassword } = userNewCredentials
      const requestBody = { ...userCredentials, newPassword }
      const teardownRequestBody = {
        username,
        password: newPassword,
        newPassword: password,
      }
      const expectedOne = "User: "
      const expectedTwo = " has updated either/both their username or password."

      const response = await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expectedOne)
      assert.include(response.text, expectedTwo)

      await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(teardownRequestBody)
        .expect(OK)
    })

    it("When both new credentiald are added and valid, then response is ok", async function () {
      const { username, password } = userCredentials
      const { newUsername, newPassword } = userNewCredentials
      const requestBody = {
        ...userCredentials,
        newUsername,
        newPassword,
      }
      const teardownRequestBody = {
        username: newUsername,
        password: newPassword,
        newUsername: username,
        newPassword: password,
      }
      const expectedOne = "User: "
      const expectedTwo = " has updated either/both their username or password."

      const response = await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expectedOne)
      assert.include(response.text, expectedTwo)

      await userSession
        .put("/users/")
        .set("x-csrf-token", csrfToken)
        .send(teardownRequestBody)
        .expect(OK)
    })
  })

  describe("Delete /:username", () => {
    const newUserCredentials = {
      username: "Username",
      password: "Password1",
    }

    it("When regular user tries to delete other user, then response is forbidden", async function () {
      const expected = "Forbidden."
      const usernameSearch = "rina.dark"

      const response = await userSession
        .delete("/users/" + usernameSearch)
        .set("x-csrf-token", csrfToken)

      assert.strictEqual(response.status, FORBIDDEN)
      assert.include(response.text, expected)
    })

    it("When username given is the logged in user, then user is deleted with a response message", async function () {
      const expected = " has deleted their own account."
      const usernameSearch = newUserCredentials.username
      const newUserSession = session(app)
      await newUserSession
        .post("/register")
        .send(newUserCredentials)
        .expect(CREATED)
      const newLoginResponse = await newUserSession
        .post("/login")
        .send(newUserCredentials)
      const newCsrfToken = JSON.parse(newLoginResponse.text).csrfToken

      const response = await newUserSession
        .delete("/users/" + usernameSearch)
        .set("x-csrf-token", newCsrfToken)
        .send(userCredentials)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })

    it("When admin inputs username to delete another user, then user is deleted with a response message", async function () {
      const expected = " has deleted user"
      newUserCredentials.username = "Username2"
      const usernameSearch = newUserCredentials.username
      await session(app)
        .post("/register")
        .send(newUserCredentials)
        .expect(CREATED)
      const adminSession = session(app)
      const adminLoginResponse = await adminSession
        .post("/login")
        .send(adminCredentials)
        .expect(OK)
      const adminCsrfToken = JSON.parse(adminLoginResponse.text).csrfToken

      const response = await adminSession
        .delete("/users/" + usernameSearch)
        .set("x-csrf-token", adminCsrfToken)
        .send(adminCredentials)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })
  })
})
