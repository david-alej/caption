"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Captions",
      [
        {
          userId: 1,
          photoId: "",
          text: "",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
        },
        {
          userId: 2,
          photoId: 3,
          text: "Didn't know there was brwon penguins!",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
        },
        {
          userId: 3,
          photoId: "",
          text: "",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
        },
        {
          userId: 4,
          photoId: 1,
          text: "yo",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
        },
        {
          userId: 4,
          photoId: 2,
          text: "yo",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
        },
        {
          userId: 4,
          photoId: 3,
          text: "yo",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
        },
      ],
      {}
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Captions", null, {})
  },
}
