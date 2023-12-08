const { expect, httpMocks } = require("../common")

const { rateLimiter } = require("../../controllers/index").rateLimiters
const { Api429Error } = require("../../util/index").apiErrors

const { createResponse, createRequest } = httpMocks

require("dotenv").config()

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

describe.only("Rate Limiters Controllers", function () {
  const durationInSeconds = 1
  let res, nextReturn
  const next = (value) => (nextReturn = value)

  beforeEach(function () {
    res = createResponse()
  })

  describe("rateLimiter", function () {
    it("Waited a second before first test", async function () {
      this.timeout(1000 * durationInSeconds + 10)
      await wait(1000 * durationInSeconds)
    })

    it("When a non-logged in user tries to acces a non-photos route more than 10 times in less than one minute, Then a 429 api error is sent through next()", async function () {
      const iterations = 11
      const req = createRequest({
        method: "GET",
        originalUrl: "/login",
        ip: "localhost",
      })
      const results = []

      for (let i = 0; i < iterations; i++) {
        await rateLimiter(req, res, next)

        results.push(nextReturn)
      }
      const lastResult = results.pop()
      const allResultsBeforeLastResultAreUndefined = results.every(
        (value) => value === undefined
      )

      expect(allResultsBeforeLastResultAreUndefined).is.true
      expect(lastResult instanceof Api429Error).to.be.true
      expect(lastResult.description).to.equal(
        "Client:  has made to many request to the original url, /login."
      )
    })

    it("Waited a minute before second test", async function () {
      this.timeout(1000 * durationInSeconds + 10)
      await wait(1000 * durationInSeconds)
    })

    it("When a logged in user tries to acces a non-photos route more than 300 times in less than one minute, Then a 429 api error is sent through next()", async function () {
      const iterations = 301
      const userId = 4
      const req = createRequest({
        method: "GET",
        originalUrl: "/register",
        ip: "localhost",
        user: { id: userId },
        session: {
          authorized: true,
        },
      })
      const results = []

      for (let i = 0; i < iterations; i++) {
        await rateLimiter(req, res, next)

        results.push(nextReturn)
      }
      const lastResult = results.pop()
      const allResultsBeforeLastResultAreUndefined = results.every(
        (value) => value === undefined
      )

      expect(allResultsBeforeLastResultAreUndefined).is.true
      expect(lastResult instanceof Api429Error).to.be.true
      expect(lastResult.description).to.equal(
        `User: ${userId} has made to many request to the original url, /register.`
      )
    })

    it("When a non-logged in user tries to acces a photos route more than 2 times in less than one minute, Then a 429 api error is sent through next()", async function () {
      const iterations = 3
      const req = createRequest({
        method: "PUT",
        originalUrl: "/photos/1",
        ip: "localhost",
        params: {
          photoId: 2,
        },
      })
      const results = []

      for (let i = 0; i < iterations; i++) {
        await rateLimiter(req, res, next)

        results.push(nextReturn)
      }
      const lastResult = results.pop()
      const allResultsBeforeLastResultAreUndefined = results.every(
        (value) => value === undefined
      )

      expect(allResultsBeforeLastResultAreUndefined).is.true
      expect(lastResult instanceof Api429Error).to.be.true
      expect(lastResult.description).to.equal(
        "Client:  has made to many request to the original url, /photos/1."
      )
    })

    it("Waited a minute before fourth test", async function () {
      this.timeout(1000 * durationInSeconds + 10)
      await wait(1000 * durationInSeconds)
    })

    it("When a logged in user tries to acces a photos route more than 10 times in less than one minute, Then a 429 api error is sent through next()", async function () {
      const userId = 3
      const iterations = 11
      const req = createRequest({
        method: "PUT",
        originalUrl: "/photos/1",
        ip: "localhost",
        params: {
          photoId: 1,
        },
        user: { id: userId },
        session: {
          authorized: true,
        },
      })
      const results = []

      for (let i = 0; i < iterations; i++) {
        await rateLimiter(req, res, next)

        results.push(nextReturn)
      }
      const lastResult = results.pop()
      const allResultsBeforeLastResultAreUndefined = results.every(
        (value) => value === undefined
      )

      expect(allResultsBeforeLastResultAreUndefined).is.true
      expect(lastResult instanceof Api429Error).to.be.true
      expect(lastResult.description).to.equal(
        `User: ${userId} has made to many request to the original url, /photos/1.`
      )
    })
  })
})
