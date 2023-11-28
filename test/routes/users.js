const {
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

    const currentAxiosConfig = { ...axiosConfig }

    currentAxiosConfig.baseURL += apiConnection.port

    client = axios.create(currentAxiosConfig)

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

  describe("Delete /:username", function () {
    const deleteUserCredentials = {}
    let deleteSetHeaders = { headers: {} }

    beforeEach(async function () {
      deleteUserCredentials.username = generateUsername()
      deleteUserCredentials.password = generatePassword()

      const { status } = await client.post("/register", deleteUserCredentials)

      const {
        status: status1,
        data,
        headers,
      } = await client.post("/login", deleteUserCredentials)

      deleteSetHeaders.headers.Cookie = headers["set-cookie"]
      deleteSetHeaders.headers["x-csrf-token"] = data.csrfToken

      expect(status).to.equal(CREATED)
      expect(status1).to.equal(OK)
    })

    it("When regular user tries to delete other user, then response is forbidden", async function () {
      const expected = "Forbidden."
      const expectedOne = 1
      const usernameSearch = deleteUserCredentials.username

      const { status, data } = await client.delete(
        "/users/" + usernameSearch,
        setHeaders
      )

      const deleted = await models.User.destroy({
        where: { username: deleteUserCredentials.username },
      })

      expect(status).to.equal(FORBIDDEN)
      expect(data).to.equal(expected)
      expect(deleted).to.equal(expectedOne)
    })

    it("When username given is the logged in user, then user is deleted with a response message", async function () {
      const expected = " has deleted their own account."
      const expectedOne = null
      const usernameSearch = deleteUserCredentials.username
      const requestBody = deleteUserCredentials
      deleteSetHeaders.data = requestBody

      const { status, data } = await client.delete(
        "/users/" + usernameSearch,
        deleteSetHeaders
      )

      const searched = await models.User.findOne({
        where: {
          username: deleteUserCredentials.username,
        },
      })

      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(searched).to.equal(expectedOne)
    })

    it("When admin inputs username to delete another user, then user is deleted with a response message", async function () {
      const expected = " has deleted user"
      const expectedOne = null
      const usernameSearch = deleteUserCredentials.username
      const { data: data1, headers: headers1 } = await client.post(
        "/login",
        adminCredentials
      )
      const adminSetHeaders = {
        headers: {
          Cookie: headers1["set-cookie"],
          "x-csrf-Token": data1.csrfToken,
        },
        data: adminCredentials,
      }

      const { status, data } = await client.delete(
        "/users/" + usernameSearch,
        adminSetHeaders
      )

      const searched = await models.User.findOne({
        where: { username: usernameSearch },
      })

      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(searched).to.equal(expectedOne)
    })
  })
})
