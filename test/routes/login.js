const {
  app,
  assert,
  describe,
  httpStatusCodes,
  models,
  request,
} = require("../common")

const { OK, UNAUTHORIZED } = httpStatusCodes

describe("Login routes", () => {
  describe("Get /", () => {
    it("When valid request is made, then status is ok", async function () {
      const response = await request(app).get("/login")

      assert.strictEqual(response.status, OK)
    })
  })

  describe("Post /", () => {
    it("When username that does not exist, then response is an unauthorized #usernameExists #authenticate", async function () {
      const expected = "Unauthorized."
      const credentials = {
        username: "nonExistingUsername",
        password: "blahblah1Q",
      }

      const response = await request(app)
        .post("/login")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.text, expected)
      assert.strictEqual(response.status, UNAUTHORIZED)
    })

    it("When password does not match existing password, then response is an correct password #correctPassword #authenticate", async function () {
      const expected = "Unauthorized."
      const setupCredentials = {
        username: "username",
        password: "Password0",
      }
      const credentials = {
        username: "username",
        password: "wrongPassword0",
      }

      await request(app).post("/register").type("form").send(setupCredentials)
      const response = await request(app)
        .post("/login")
        .type("form")
        .send(credentials)

      assert.strictEqual(response.text, expected)
      assert.strictEqual(response.status, UNAUTHORIZED)

      models.User.destroy({ truncate: true })
    })

    it("When authentication works, then user is logged in #authenticate", async function () {
      const expectedOne = "User: "
      const expectedTwo = " is now logged in."
      const setupCredentials = {
        username: "username",
        password: "Password0",
      }
      const credentials = {
        username: "username",
        password: "Password0",
      }

      await request(app).post("/register").type("form").send(setupCredentials)
      const response = await request(app)
        .post("/login")
        .type("form")
        .send(credentials)

      assert.include(response.text, expectedOne)
      assert.include(response.text, expectedTwo)
      assert.strictEqual(response.status, OK)

      models.User.destroy({ truncate: true })
    })
  })
})
