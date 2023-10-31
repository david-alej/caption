const { app, assert, describe, httpStatusCodes, request } = require("../common")

const { OK } = httpStatusCodes

describe("Users route", () => {
  describe("Get /", () => {
    it("When valid request is made, then all the users are in the response.", async function () {
      const expected = []

      const response = await request(app).get("/users")

      assert.strictEqual(response.status, OK)
      assert.deepEqual(JSON.parse(response.text), expected)
    })
  })
})
