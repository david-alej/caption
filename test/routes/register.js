const {
  app,
  assert,
  describe,
  httpStatusCodes,
  models,
  request,
  server,
} = require("../common")

const { OK, BAD_REQUEST, CREATED } = httpStatusCodes

describe("Register routes", () => {
  after(async function () {
    server.close()
  })

  describe("Get /", () => {
    it("When valid request is made, then status is ok", async function () {
      const response = await request(app).get("/register")

      assert.strictEqual(response.status, OK)
    })
  })

  describe("Post /", () => {
    it("When one of the credentials (username) is empty an empty string, then response is a bad request #basicCredentialValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = { username: "", password: "password" }

      const response = await request(app)
        .post("/register")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When one of the credentials (password) is undefined, then response is a bad request #basicCredentialValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = { username: "username" }

      const response = await request(app)
        .post("/register")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When one of the creditials (username) inlcudes a space, then response is a bad request #basicCredentialValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = { username: "username ", password: "password" }

      const response = await request(app)
        .post("/register")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When username has less than 4 characters, then response is a bad request #usernameValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = { username: "use", password: "password" }

      const response = await request(app)
        .post("/register")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When username has more than 20 characters, then response is a bad request #usernameValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = {
        username: "overExceedCharacterLimit",
        password: "password",
      }

      const response = await request(app)
        .post("/register")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When password has less than 8 characters, then response is a bad request #passwordValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = { username: "username", password: "passwor" }

      const response = await request(app)
        .post("/register")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When password has more than 20 characters, then response is a bad request #passwordValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = {
        username: "username",
        password: "overExceedCharacterLimit",
      }

      const response = await request(app)
        .post("/register")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When password does not contain a number, then response is a bad request #passwordValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = {
        username: "username",
        password: "password",
      }

      const response = await request(app)
        .post("/register")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When password does not contain an uppercase letter, then response is a bad request #passwordValidator #credentialsValidator", async function () {
      const expected = "Bad request."
      const credentials = {
        username: "username",
        password: "password1",
      }

      const response = await request(app)
        .post("/register")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })

    it("When credentials are validated but username is already in use, then response is a bad request", async function () {
      const expected = "Bad request."
      const setupCredentials = {
        username: "commonUsername",
        password: "password1Q",
      }
      const credentials = setupCredentials

      await request(app).post("/register").type("form").send(setupCredentials)

      const response = await request(app)
        .post("/register")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)

      models.User.destroy({ where: { username: setupCredentials.username } })
    })

    it("When credentials are validated, then user is created #credentialsValidator", async function () {
      const expected = "is created."
      const credentials = {
        username: "newUser",
        password: "password1Q",
      }

      const response = await request(app)
        .post("/register")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.status, CREATED)
      assert.include(response.text, expected)

      models.User.destroy({ where: { username: credentials.username } })
    })
  })
})
