const { expect } = require("../common")

const { isOperationalError } = require("../../controllers/errorHandlers")
const { Api400Error, Api500Error } = require("../../util/apiErrors")

describe("Error Handlers", function () {
  describe("isOperationalError", function () {
    it("When error is not instance of apiError, Then return is true", async function () {
      let isOperationalErr

      try {
        throw new Error("Message")
      } catch (err) {
        isOperationalErr = isOperationalError(err)
      }

      expect(isOperationalErr).to.be.false
    })

    it("When error is instance of apiError but not operational, Then the return is false", async function () {
      let isOperationalErr

      try {
        throw new Api500Error("Message")
      } catch (err) {
        isOperationalErr = isOperationalError(err)
      }

      expect(isOperationalErr).to.be.false
    })

    it("When error is instance of apiError and an operational error, Then return is true", async function () {
      let isOperationalErr

      try {
        throw new Api400Error("Message")
      } catch (err) {
        isOperationalErr = isOperationalError(err)
      }

      expect(isOperationalErr).to.be.true
    })
  })
})
