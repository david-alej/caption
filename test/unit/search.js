const {
  expect,
  generateUsername,
  httpStatusCodes,
  models,
} = require("../common")

const { INTERNAL_SERVER_ERROR } = httpStatusCodes

const { inputsToSearch } = require("../../util/search")

describe("Search", function () {
  let request = {
    body: {},
    session: { user: {} },
  }
  const nameOfTables = ["User", "Photo", "Caption"]
  const otherOptions = {
    include: [
      {
        // eslint-disable-next-line mocha/no-setup-in-describe
        model: models.Vote,
        as: "votes",
        attributes: [],
      },
    ],
  }
  const defaultSearch = {
    ...otherOptions,
    limit: 10,
  }

  let nameOfTable

  describe("inputsToSearch", function () {
    beforeEach(function () {
      request.session.user.id = Math.ceil(Math.random() * 10)

      nameOfTable =
        nameOfTables[Math.floor(Math.random() * nameOfTables.length)]
    })

    it("When no valid inputs are put in the request body, Then the return is the default search and an after message of a period", function () {
      const req = JSON.parse(JSON.stringify(request))

      const { afterMsg, searchParams } = inputsToSearch(
        req,
        defaultSearch,
        otherOptions,
        nameOfTable
      )

      expect(afterMsg).to.equal(".")
      expect(searchParams).to.equal(defaultSearch)
    })

    it("When more than 2 valid inputs are put in the request body, Then the return is the default search and an after message of a period", function () {
      const userId = Math.floor(Math.random() * 10)
      const photoId = Math.floor(Math.random() * 5)
      const username = generateUsername()
      const req = JSON.parse(JSON.stringify(request))
      req.body = { userId, username, photoId }

      try {
        inputsToSearch(req, defaultSearch, otherOptions, nameOfTable)
      } catch (err) {
        expect(err).to.include({
          description:
            `User: ${req.session.user.id} something went wrong with ` +
            nameOfTable.toLowerCase() +
            // eslint-disable-next-line quotes
            '\'s "allowedBodyInputsValidator" function in the validators.',
          statusCode: INTERNAL_SERVER_ERROR,
        })
      }
    })

    it("When one valid input (username) are put in the request body, Then the return is the default search and an after message of a period", function () {
      const userId = Math.floor(Math.random() * 10)
      const req = JSON.parse(JSON.stringify(request))
      req.body = { userId }

      const { afterMsg, searchParams } = inputsToSearch(
        req,
        defaultSearch,
        otherOptions,
        nameOfTable
      )

      expect(afterMsg).to.equal("with given User id= " + userId + ".")
      expect(searchParams).to.eql({
        where: { userId },
        ...otherOptions,
      })
    })

    it("When both valid inputs (userId, photoId) are put in the request body, Then the return is the default search and an after message of a period", function () {
      const userId = Math.floor(Math.random() * 10)
      const photoId = Math.floor(Math.random() * 5)
      const req = JSON.parse(JSON.stringify(request))
      req.body = { userId, photoId }

      const { afterMsg, searchParams } = inputsToSearch(
        req,
        defaultSearch,
        otherOptions,
        nameOfTable
      )

      expect(afterMsg).to.equal(
        "with given User id= " + userId + ", and Photo id= " + photoId + "."
      )
      expect(searchParams).to.eql({
        where: { userId, photoId },
        ...otherOptions,
      })
    })
  })
})
