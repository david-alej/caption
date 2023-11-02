const {
  app,
  assert,
  describe,
  httpStatusCodes,
  models,
  request,
  session,
} = require("../common")

const { OK, CREATED } = httpStatusCodes

describe("Logout routes", () => {
  describe("Get /", () => {
    it("When valid request is made, then status is ok", async function () {
      const credentials = {
        username: "username",
        password: "Password1",
      }

      const response = await session(app).post("/register").send(credentials)

      assert.strictEqual(response.status, CREATED)
    })
  })

  describe("Post /", () => {
    it("When route is requested, then user is logged out", async function () {
      const expectedOne = "User: "
      const expectedTwo = " is now logged out."
      const credentials = {
        username: "username1",
        password: "Password1",
      }
      const loginSession = session(app)
      await session(app).post("/register").send(credentials)
      await loginSession.post("/login").send(credentials)
      const response = await loginSession.post("/logout")

      assert.include(response.text, expectedOne)
      assert.include(response.text, expectedTwo)
      assert.strictEqual(response.status, OK)
    })
  })

  describe("after authenticating session", function () {
    let authenticatedSession = ""

    beforeEach(function (done) {
      const testSession = session(app)
      const credentials = {
        username: "username1",
        password: "Password1",
      }
      testSession
        .post("/login")
        .send(credentials)
        .expect(200)
        .end(function (err) {
          if (err) return done(err)
          authenticatedSession = testSession
          return done()
        })
    })

    it("should get a restricted page", function (done) {
      authenticatedSession.get("/logout").expect(200).end(done)
    })
  })
})
