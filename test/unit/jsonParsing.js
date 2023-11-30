const { expect, models } = require("../common")

const otherOptions = {
  include: [
    {
      model: models.Caption,
      as: "captions",
      include: [
        {
          model: models.User,
          as: "author",
          attributes: { exclude: ["password"] },
        },
      ],
      order: [["votes", "DESC"]],
      limit: 10,
    },
    {
      model: models.User,
      as: "author",
      attributes: { exclude: ["password"] },
    },
  ],
}

const average = (array) => array.reduce((a, b) => a + b) / array.length

describe("JSON parsing for Sequelize", function () {
  let before, time
  const n = 40
  describe("sequelize.model.Table.findOne", function () {
    it("When finding fastest method between using JSON parse-stringify hack and .dataValues to get the data, Then .dataValues is the fastest (times is in 10^(-6) seconds)", async function () {
      const jsonMethodsTimes = []
      const dataValuesTimes = []

      let searched
      let i = 0

      while (i < n) {
        searched = await models.Photo.findOne({
          where: { id: 2 },
          ...otherOptions,
        })

        if (searched === null) {
          throw Error(i + " iteration had bad search query")
        }

        before = process.hrtime()
        JSON.parse(JSON.stringify(searched))
        time = process.hrtime(before)

        jsonMethodsTimes.push(time[1] / 10 ** 3 + time[0] * 10 ** 6)

        searched = await models.Photo.findOne({
          where: { id: 2 },
          ...otherOptions,
        })

        if (searched === null) {
          throw Error(i + " iteration had bad search query")
        }

        before = process.hrtime()
        searched.dataValues
        time = process.hrtime(before)

        dataValuesTimes.push(time[1] / 10 ** 3 + time[0] * 10 ** 6)

        i++
      }

      const jsonMethodsAvg = average(jsonMethodsTimes)
      const dataValuesAvg = average(dataValuesTimes)

      console.log(jsonMethodsTimes, dataValuesTimes)
      console.log(jsonMethodsAvg, dataValuesAvg)

      expect(jsonMethodsAvg > dataValuesAvg).to.be.true
    })
  })

  describe("sequelize.model.Table.findAll", function () {
    it("When finding fastest method between using JSON parse-stringify hack and .map & .dataValues to get the data, Then .map & .dataValues is the fastest (times is in 10^(-6) seconds) ", async function () {
      const jsonMethodsTimes = []
      const dataValuesTimes = []

      let searched
      let i = 0

      while (i < n) {
        searched = await models.Photo.findAll()

        if (searched === null) {
          throw Error(i + " iteration had bad search query")
        }

        before = process.hrtime()
        JSON.parse(JSON.stringify(searched))
        time = process.hrtime(before)

        jsonMethodsTimes.push(time[1] / 10 ** 3 + time[0] * 10 ** 6)

        searched = await models.Photo.findAll()

        if (searched === null) {
          throw Error(i + " iteration had bad search query")
        }

        before = process.hrtime()
        searched.map((photo) => photo.dataValues)
        time = process.hrtime(before)

        dataValuesTimes.push(time[1] / 10 ** 3 + time[0] * 10 ** 6)

        i++
      }

      const jsonMethodsAvg = average(jsonMethodsTimes)
      const dataValuesAvg = average(dataValuesTimes)

      console.log(jsonMethodsTimes, dataValuesTimes)
      console.log(jsonMethodsAvg, dataValuesAvg)

      expect(jsonMethodsAvg > dataValuesAvg).to.be.true
    })
  })
})
