const {
  app,
  assert,
  describe,
  httpStatusCodes,
  models,
  request,
  session,
} = require("../common")

const { OK, CREATED, BAD_REQUEST, FORBIDDEN } = httpStatusCodes

describe("Logout routes", () => {
  after(async function () {
    await models.User.destroy({ truncate: true })
  })

  describe("Get /", () => {
    it("When the request does not have cookies attached, then unauthorized message is sent #authorize", async function () {
      const expected = "Bad request."
      const credentials = {
        username: "username1",
        password: "Password1",
      }
      await request(app).post("/register").send(credentials).expect(CREATED)
      await request(app).post("/login").send(credentials).expect(OK)

      const response = await request(app).get("/logout")

      assert.include(response.text, expected)
      assert.strictEqual(response.status, BAD_REQUEST)

      models.User.destroy({ truncate: true })
    })

    // eslint-disable-next-line quotes
    it('When request does not include a "x-csrf-token" with csrf token, then the response is "invalid csrf token" #doubleCsrfProtection', async function () {
      const expected = "invalid csrf token"
      const credentials = {
        username: "username1",
        password: "Password1",
      }
      const userSession = session(app)
      await request(app).post("/register").send(credentials).expect(CREATED)
      await userSession.post("/login").send(credentials).expect(OK)

      const response = await userSession.post("/logout")

      assert.include(response.text, expected)
      assert.strictEqual(response.status, FORBIDDEN)

      models.User.destroy({ truncate: true })
    })

    it("When valid request is made, then status is ok", async function () {
      const credentials = {
        username: "username",
        password: "Password1",
      }
      const userSession = session(app)
      await userSession.post("/register").send(credentials).expect(CREATED)
      await userSession.post("/login").send(credentials).expect(OK)

      const response = await userSession.get("/logout")

      assert.strictEqual(response.status, OK)

      models.User.destroy({ truncate: true })
    })
  })

  describe("Post /", () => {
    it("When the request does not have cookies attached, then unauthorized message is sent #authorize", async function () {
      const expected = "Bad request."
      const credentials = {
        username: "username1",
        password: "Password1",
      }
      await request(app).post("/register").send(credentials).expect(CREATED)
      const loginResponse = await request(app)
        .post("/login")
        .send(credentials)
        .expect(OK)
      const csrfToken = JSON.parse(loginResponse.text).csrfToken

      const response = await request(app)
        .post("/logout")
        .set("x-csrf-token", csrfToken)

      assert.include(response.text, expected)
      assert.strictEqual(response.status, BAD_REQUEST)

      models.User.destroy({ truncate: true })
    })

    it("When route is requested, then user is logged out", async function () {
      const expectedOne = "User: "
      const expectedTwo = " is now logged out."
      const credentials = {
        username: "username1",
        password: "Password1",
      }
      const userSession = session(app)
      await request(app).post("/register").send(credentials).expect(CREATED)
      const loginResponse = await userSession
        .post("/login")
        .send(credentials)
        .expect(OK)
      const csrfToken = JSON.parse(loginResponse.text).csrfToken

      const response = await userSession
        .post("/logout")
        .set("x-csrf-token", csrfToken)

      assert.include(response.text, expectedOne)
      assert.include(response.text, expectedTwo)
      assert.strictEqual(response.status, OK)

      models.User.destroy({ truncate: true })
    })
  })
})
