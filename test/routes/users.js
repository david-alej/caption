const {
  app,
  assert,
  server,
  session,
  axios,
  axiosConfig,
  initializeWebServer,
  stopWebServer,
  expect,
  httpStatusCodes,
  models,
  generatePassword,
  generateUsername,
} = require("../common")

const { OK, CREATED, NOT_FOUND, BAD_REQUEST, FORBIDDEN } = httpStatusCodes

describe("Users route", function () {
  const userCredentials = {}
  const adminCredentials = {
    username: "yomaster",
    password: "yoyoyo1Q",
  }

  let client
  let setHeaders = { headers: {} }

  before(async function () {
    userCredentials.username = generateUsername()
    userCredentials.password = generatePassword()

    const apiConnection = await initializeWebServer()

    axiosConfig.baseURL += apiConnection.port

    client = axios.create(axiosConfig)

    const { status } = await client.post("/register", userCredentials)

    const {
      status: status1,
      data,
      headers,
    } = await client.post("/login", userCredentials)

    setHeaders.headers.Cookie = headers["set-cookie"]
    setHeaders.headers["x-csrf-token"] = data.csrfToken

    expect(status).to.equal(CREATED)
    expect(status1).to.equal(OK)
  })

  after(async function () {
    const deleted = await models.User.destroy({
      where: { username: userCredentials.username },
    })

    await stopWebServer()

    expect(deleted).to.equal(1)
  })

  const userSchema = {
    title: "Users schema",
    type: "array",
    items: {
      type: "object",
      required: [
        "id",
        "username",
        "isAdmin",
        "createdAt",
        "updatedAt",
        "photos",
      ],
      properties: {
        photos: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
    },
  }

  describe("Get /", function () {
    it("When an authorized request is made, then all the users are in the response", async function () {
      const expected = [
        {
          username: userCredentials.username,
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

      const { status, data } = await client.get("/users", setHeaders)

      expect(status).to.equal(OK)
      expect(data).to.be.jsonSchema(userSchema)
      for (let i = 0; i < expected.length; i++) {
        const resultObject = data[parseInt(i)]
        const expectedObject = expected[parseInt(i)]
        expect(resultObject).to.include(expectedObject)
      }
    })
  })

  describe("Get /:username", function () {
    it("When given username is invalid, then the response is bad request #usernameValidator #paramUsername", async function () {
      const expected = "Bad request."
      const usernameSearch = "usernam e"

      const { status, data } = await client.get(
        "/users/" + usernameSearch,
        setHeaders
      )

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When given username does not exist in the database, then the response is a not found message #paramUsername", async function () {
      const expected = "Not found."
      const usernameSearch = "nonExisitngUsername"

      const { status, data } = await client.get(
        "/users/" + usernameSearch,
        setHeaders
      )

      expect(status).to.equal(NOT_FOUND)
      expect(data).to.equal(expected)
    })

    it("When given username does exist in the database, then the user is in the response", async function () {
      const usernameSearch = "penguinlover"
      const expected = {
        username: usernameSearch,
        isAdmin: false,
        createdAt: "2023-11-02T20:00:00.000Z",
        updatedAt: "2023-11-02T20:00:00.000Z",
      }

      const { status, data } = await client.get(
        "/users/" + usernameSearch,
        setHeaders
      )

      expect(status).to.equal(OK)
      expect(data).to.include(expected)
    })
  })

  describe("Put /", function () {
    const putUserCredentials = {}
    const putUserNewCredentials = {}

    let putSetHeaders = { headers: {} }

    beforeEach(async function () {
      putUserCredentials.username = generateUsername()
      putUserCredentials.password = generatePassword()
      putUserNewCredentials.newUsername = generateUsername()
      putUserNewCredentials.newPassword = generatePassword()

      const { status } = await client.post("/register", putUserCredentials)

      const {
        status: status1,
        data,
        headers,
      } = await client.post("/login", putUserCredentials)

      putSetHeaders.headers.Cookie = headers["set-cookie"]
      putSetHeaders.headers["x-csrf-token"] = data.csrfToken

      expect(status).to.equal(CREATED)
      expect(status1).to.equal(OK)
    })

    afterEach(async function () {
      const deleted = await models.User.destroy({
        where: { username: putUserCredentials.username },
      })

      expect(deleted).to.equal(1)
    })

    it("When no new credentials are added, then response is a bad request", async function () {
      const expected = "Bad request."
      const requestBody = putUserCredentials

      const { status, data } = await client.put(
        "/users/",
        requestBody,
        putSetHeaders
      )

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When a new username is entered but it already exists, then response is a bad request", async function () {
      const requestBody = {
        ...putUserCredentials,
        newUsername: putUserCredentials.username,
      }
      const expected = "Bad request."

      const { status, data } = await client.put(
        "/users/",
        requestBody,
        putSetHeaders
      )

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When a valid new username is provided, then response is ok", async function () {
      const { password } = putUserCredentials
      const { newUsername } = putUserNewCredentials
      const requestBody = { ...putUserCredentials, newUsername }
      const expected = " has updated either/both their username or password."

      const { status, data } = await client.put(
        "/users/",
        requestBody,
        putSetHeaders
      )

      const { status: status1 } = await client.post("/login", {
        username: newUsername,
        password: password,
      })
      putUserCredentials.username = newUsername

      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(status1).to.equal(OK)
    })

    it("When a valid new password is provided, then response is ok", async function () {
      const { username } = putUserCredentials
      const { newPassword } = putUserNewCredentials
      const requestBody = { ...putUserCredentials, newPassword }
      const expected = " has updated either/both their username or password."

      const { status, data } = await client.put(
        "/users/",
        requestBody,
        putSetHeaders
      )

      const { status: status1 } = await client.post("/login", {
        username: username,
        password: newPassword,
      })

      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(status1).to.equal(OK)
    })

    it("When both new credentiald are added and valid, then response is ok", async function () {
      const { newUsername, newPassword } = putUserNewCredentials
      const requestBody = {
        ...putUserCredentials,
        newUsername,
        newPassword,
      }
      const expected = " has updated either/both their username or password."

      const { status, data } = await client.put(
        "/users/",
        requestBody,
        putSetHeaders
      )

      const { status: status1 } = await client.post("/login", {
        username: newUsername,
        password: newPassword,
      })
      putUserCredentials.username = newUsername

      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(status1).to.equal(OK)
    })
  })

  describe.only("Delete /:username", function () {
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

      await adminSession
        .post("/logout")
        .set("x-csrf-token", adminCsrfToken)
        .expect(OK)
    })
  })
})
