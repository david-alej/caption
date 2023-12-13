"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Votes",
      [
        {
          userId: 1,
          captionId: 4,
          value: -1,
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
        },
        {
          userId: 1,
          captionId: 2,
          value: -1,
          createdAt: "2023-11-04T20:02:00.000Z",
          updatedAt: "2023-11-04T20:02:00.000Z",
        },
        {
          userId: 3,
          captionId: 2,
          value: 1,
          createdAt: "2023-11-04T20:03:00.000Z",
          updatedAt: "2023-11-04T20:03:00.000Z",
        },
        {
          userId: 4,
          captionId: 2,
          value: 1,
          createdAt: "2023-11-04T20:04:00.000Z",
          updatedAt: "2023-11-04T20:04:00.000Z",
        },
        {
          userId: 2,
          captionId: 3,
          value: 1,
          createdAt: "2023-11-04T20:05:00.000Z",
          updatedAt: "2023-11-04T20:05:00.000Z",
        },
        {
          userId: 4,
          captionId: 3,
          value: 1,
          createdAt: "2023-11-04T20:06:00.000Z",
          updatedAt: "2023-11-04T20:06:00.000Z",
        },
        {
          userId: 2,
          captionId: 6,
          value: 1,
          createdAt: "2023-11-04T20:07:00.000Z",
          updatedAt: "2023-11-04T20:07:00.000Z",
        },
        {
          userId: 3,
          captionId: 6,
          value: 1,
          createdAt: "2023-11-04T20:08:00.000Z",
          updatedAt: "2023-11-04T20:08:00.000Z",
        },
      ],
      {}
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Votes", null, {})
  },
}
