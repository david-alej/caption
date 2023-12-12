const {
  expect,
  generateUsername,
  generatePassword,
  httpMocks,
  models,
} = require("../common")

const { rateLimiter } = require("../../controllers/index").rateLimiter
const { postLogin } = require("../../controllers/index").loginControllers
const { Api401Error, Api429Error } = require("../../util/index").apiErrors
const { passwordHash } = require("../../util/index").passwordHash

const { createResponse, createRequest } = httpMocks

require("dotenv").config()

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

describe("Rate Limiters Controllers (Beware test suite will take long due to testing limiter duration)", function () {
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

    it("When a non-logged in user tries to acces a non-photos route more than 10 times in less than the duration, Then response is a too many request ", async function () {
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
      expect(lastResult).to.be.an.instanceOf(Api429Error)
      expect(lastResult.description).to.equal(
        "Client: has made to many request to the original url, /login, next retry is after 1 seconds."
      )
    })

    it("Waited a second before second test", async function () {
      this.timeout(1000 * durationInSeconds + 10)
      await wait(1000 * durationInSeconds)
    })

    it("When a logged in user tries to acces a non-photos route more than 300 times in less than the duration, Then response is a too many request ", async function () {
      const iterations = 301
      const userId = 4
      const req = createRequest({
        method: "GET",
        originalUrl: "/register",
        ip: "localhost",
        session: {
          authorized: true,
          user: { id: userId },
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
      expect(lastResult).to.be.an.instanceOf(Api429Error)
      expect(lastResult.description).to.equal(
        `User: ${userId} has made to many request to the original url, /register, next retry is after 1 seconds.`
      )
    })

    it("When a non-logged in user tries to acces a photos route more than 2 times in less than the duration, Then response is a too many request ", async function () {
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
      expect(lastResult).to.be.an.instanceOf(Api429Error)
      expect(lastResult.description).to.equal(
        "Client: has made to many request to the original url, /photos/1, next retry is after 1 seconds."
      )
    })

    it("Waited a second before fourth test", async function () {
      this.timeout(1000 * durationInSeconds + 10)
      await wait(1000 * durationInSeconds)
    })

    it("When a logged in user tries to acces a photos route more than 10 times in less than the duration, Then response is a too many request ", async function () {
      const userId = 3
      const iterations = 11
      const req = createRequest({
        method: "PUT",
        originalUrl: "/photos/1",
        ip: "localhost",
        params: {
          photoId: 1,
        },
        session: {
          authorized: true,
          user: { id: userId },
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
      expect(lastResult).to.be.an.instanceOf(Api429Error)
      expect(lastResult.description).to.equal(
        `User: ${userId} has made to many request to the original url, /photos/1, next retry is after 1 seconds.`
      )
    })
  })

  describe("Login Route .postLogin", function () {
    it("When client tries to login with wrong username and password one more time than is allowed, 100 times, in less than the duration, Then response is a too many request ", async function () {
      const iterations = 101
      const username = generateUsername()
      const password = generatePassword()
      const req = createRequest({
        method: "PUT",
        originalUrl: "/login",
        ip: "localhost",
        body: {
          username,
          password,
        },
        session: {},
      })
      const results = []

      for (let i = 0; i < iterations; i++) {
        await postLogin(req, res, next)

        results.push(nextReturn)
      }
      const lastResult = results.pop()
      const allResultsBeforeLastResultAreUndefined = results.every(
        (value) => value instanceof Api401Error
      )

      expect(lastResult).to.be.an.instanceOf(Api429Error)
      expect(lastResult.description).to.equal(
        "Client: has made to many request to the original url, /login, next retry is after 1 seconds."
      )
      expect(allResultsBeforeLastResultAreUndefined).is.true
    })

    it("Waited a second before second test", async function () {
      this.timeout(1000 * durationInSeconds + 10)
      await wait(1000 * durationInSeconds)
    })

    it("When client tries to login with wrong username and password after already getting an 429 error, Then response is a too many request ", async function () {
      const iterations = 102
      const username = generateUsername()
      const password = generatePassword()
      const req = createRequest({
        method: "PUT",
        originalUrl: "/login",
        ip: "localhost",
        body: {
          username,
          password,
        },
        session: {},
      })

      for (let i = 0; i < iterations; i++) {
        await postLogin(req, res, next)
      }
      const lastResult = nextReturn

      expect(lastResult).to.be.an.instanceOf(Api429Error)
      expect(lastResult.description).to.equal(
        "Client: has made to many request to the original url, /login, next retry is after 1 seconds."
      )
    })

    it("Waited a second before third test", async function () {
      this.timeout(1000 * durationInSeconds + 10)
      await wait(1000 * durationInSeconds)
    })

    it("When client tries to login with right username and wrong password one more time than is allowed, 10 times, in less than the duration, Then response is a too many request ", async function () {
      const iterations = 11
      const username = generateUsername()
      const password = generatePassword()
      const req = createRequest({
        method: "PUT",
        originalUrl: "/login",
        ip: "localhost",
        body: {
          username,
          password: "wrongPassword1",
        },
        session: {},
      })
      const results = []
      const hashedPassword = await passwordHash(password, 10)
      const user = await models.User.create({
        username,
        password: hashedPassword,
      })
      const userId = user.dataValues.id

      for (let i = 0; i < iterations; i++) {
        await postLogin(req, res, next)

        results.push(nextReturn)
      }
      const lastResult = results.pop()
      const allResultsBeforeLastResultAreUndefined = results.every(
        (value) => value instanceof Api401Error
      )

      await models.User.destroy({ where: { username } })

      expect(lastResult).to.be.an.instanceOf(Api429Error)
      expect(lastResult.description).to.equal(
        `User: ${userId} has made to many request to the original url, /login, next retry is after 1 seconds.`
      )
      expect(allResultsBeforeLastResultAreUndefined).is.true
    })

    it("Waited a second before fourth test", async function () {
      this.timeout(1000 * durationInSeconds + 10)
      await wait(1000 * durationInSeconds)
    })

    it("When client tries to login with right username and wrong password after already getting an 429 error, Then response is a too many request ", async function () {
      const iterations = 12
      const username = generateUsername()
      const password = generatePassword()
      const req = createRequest({
        method: "PUT",
        originalUrl: "/login",
        ip: "localhost",
        body: {
          username,
          password: "wrongPassword1",
        },
        session: {},
      })
      const hashedPassword = await passwordHash(password, 10)
      const user = await models.User.create({
        username,
        password: hashedPassword,
      })
      const userId = user.dataValues.id

      for (let i = 0; i < iterations; i++) {
        await postLogin(req, res, next)
      }
      const lastResult = nextReturn

      await models.User.destroy({ where: { username } })

      expect(lastResult).to.be.an.instanceOf(Api429Error)
      expect(lastResult.description).to.equal(
        `User: ${userId} has made to many request to the original url, /login, next retry is after 1 seconds.`
      )
    })

    it("Waited a second before fith test", async function () {
      this.timeout(1000 * durationInSeconds + 10)
      await wait(1000 * durationInSeconds)
    })

    it("When client logs in using right username and wrong password more than half of the allowed tries per duration, logs in succesfully, and logs in with the using right username and wrong password more than half of the allowed tries per duration, Then allowed tries is reset when user logged in correctly thus resulting in never returing a too many request response ", async function () {
      const iterations = 6
      const username = generateUsername()
      const password = generatePassword()
      const req = createRequest({
        method: "PUT",
        originalUrl: "/login",
        ip: "localhost",
        body: {
          username,
          password: "wrongPassword1",
        },
        session: {},
      })
      const correctReq = createRequest({
        method: "PUT",
        originalUrl: "/login",
        ip: "localhost",
        body: {
          username,
          password,
        },
        session: {},
        signedCookies: { "__Host-psifi": { "x-csrf-token": "" } },
      })
      const hashedPassword = await passwordHash(password, 10)
      const user = await models.User.create({
        username,
        password: hashedPassword,
      })
      const results = []
      const userId = user.dataValues.id

      for (let i = 0; i < iterations; i++) {
        await postLogin(req, res, next)

        results.push(nextReturn)
      }
      await postLogin(correctReq, res, next)
      const correctLoginResponse = await res._getData()
      for (let i = 0; i < iterations; i++) {
        await postLogin(req, res, next)

        results.push(nextReturn)
      }
      const allWrongResponsesAre401Error = results.every((value) => {
        return value instanceof Api401Error
      })

      await models.User.destroy({ where: { username } })

      expect(correctLoginResponse.message).to.equal(
        `User: ${userId} is now logged in.`
      )
      expect(correctLoginResponse.csrfToken).to.be.a("string")
      expect(allWrongResponsesAre401Error).to.be.true
    })
  })
})
