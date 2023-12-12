"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Captions",
      [
        {
          userId: 1,
          photoId: 2,
          text: "Why is the dog on a chair",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          votes: 0,
        },
        {
          userId: 2,
          photoId: 3,
          text: "Didn't know there was brown penguins!",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          votes: 1,
        },
        {
          userId: 3,
          photoId: 1,
          text: "Gotta catch em all!",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          votes: 2,
        },
        {
          userId: 4,
          photoId: 1,
          text: "yo",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          votes: -1,
        },
        {
          userId: 4,
          photoId: 2,
          text: "yo",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          votes: 0,
        },
        {
          userId: 4,
          photoId: 2,
          text: "That is a good salesboy",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          votes: 2,
        },
        {
          userId: 4,
          photoId: 3,
          text: "yo",
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          votes: 0,
        },
      ],
      {}
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Captions", null, {})
  },
}
