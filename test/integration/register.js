const {
  axios,
  axiosConfig,
  initializeWebServer,
  stopWebServer,
  expect,
  httpStatusCodes,
  models,
  preUserMsg,
} = require("../common")

const { OK, BAD_REQUEST, CREATED } = httpStatusCodes

describe("Register routes", function () {
  let client

  before(async function () {
    const apiConnection = await initializeWebServer()

    const currentAxiosConfig = { ...axiosConfig }

    currentAxiosConfig.baseURL += apiConnection.port

    client = axios.create(currentAxiosConfig)
  })

  after(async function () {
    await stopWebServer()
  })

  describe("Get /", function () {
    it("When valid request is made, then status is ok", async function () {
      const { status } = await client.get("/register")

      expect(status).to.equal(OK)
    })
  })

  describe("Post /", function () {
    const userSchema = {
      title: "Register post /",
      type: "object",
      required: [
        "id",
        "username",
        "password",
        "isAdmin",
        "createdAt",
        "updatedAt",
      ],
      properties: {
        id: {
          type: "integer",
        },
        username: {
          type: "string",
        },
        password: {
          type: "string",
        },
        isAdmin: {
          type: "boolean",
        },
        createdAt: {
          type: "object",
          require: ["date"],
        },
        updatedAt: {
          type: "object",
          require: ["date"],
        },
      },
    }

    it("When one of the credentials (username) is empty an empty string, then response is a bad request #basicCredentialValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = { username: "", password: "password" }

      const { status, data } = await client.post("/register", credentials)

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When one of the credentials (password) is undefined, then response is a bad request #basicCredentialValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = { username: "username" }

      const { status, data } = await client.post("/register", credentials)

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When one of the creditials (username) inlcudes a space, then response is a bad request #basicCredentialValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = { username: "username ", password: "password" }

      const { status, data } = await client.post("/register", credentials)

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When username has less than 4 characters, then response is a bad request #usernameValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = { username: "use", password: "password" }

      const { status, data } = await client.post("/register", credentials)

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When username has more than 20 characters, then response is a bad request #usernameValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = {
        username: "overExceedCharacterLimit",
        password: "password",
      }

      const { status, data } = await client.post("/register", credentials)

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When password has less than 8 characters, then response is a bad request #passwordValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = { username: "username", password: "passwor" }

      const { status, data } = await client.post("/register", credentials)

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When password has more than 20 characters, then response is a bad request #passwordValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = {
        username: "username",
        password: "overExceedCharacterLimit",
      }

      const { status, data } = await client.post("/register", credentials)

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When password does not contain a number, then response is a bad request #passwordValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = {
        username: "username",
        password: "password",
      }

      const { status, data } = await client.post("/register", credentials)

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When password does not contain an uppercase letter, then response is a bad request #passwordValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = {
        username: "username",
        password: "password1",
      }

      const { status, data } = await client.post("/register", credentials)

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When credentials are validated but username is already in use, then response is a bad request", async function () {
      const expected = "Bad request."
      const setupCredentials = {
        username: "commonUsername",
        password: "password1Q",
      }
      const credentials = setupCredentials

      await client.post("/register", setupCredentials)

      const { status, data } = await client.post("/register", credentials)

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)

      models.User.destroy({ where: { username: setupCredentials.username } })
    })

    it("When credentials are validated, then user is created #credentialsValidator", async function () {
      const afterMsg = "is created."
      const expectedOne = 1
      const credentials = {
        username: "newUser",
        password: "password1Q",
      }

      const { status, data } = await client.post("/register", credentials)
      const searched = await models.User.findOne({
        where: { username: credentials.username },
      })
      const deleted = await models.User.destroy({
        where: { username: credentials.username },
      })

      expect(status).to.equal(CREATED)
      expect(data).to.include.string(preUserMsg).and.string(afterMsg)
      expect(searched.dataValues).to.deep.jsonSchema(userSchema)
      expect(deleted).to.equal(expectedOne)
    })
  })
})
