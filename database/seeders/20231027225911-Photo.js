"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Photos",
      [
        {
          userId: 1,
          title: "Designer",
          filename: "744fe784-f556-4c68-a81a-2e5d859e27ef.jpg",
          createdAt: "2023-11-04T20:00:00.000Z",
          updatedAt: "2023-11-04T20:00:00.000Z",
        },
        {
          userId: 2,
          title: "Sales Consultant",
          filename: "a5f8cb21-a34f-4e15-a3a6-d3fe656b1d56.jpg",
          createdAt: "2023-11-04T20:00:00.000Z",
          updatedAt: "2023-11-04T20:00:00.000Z",
        },
        {
          userId: 3,
          title: "Me and my siblings",
          filename: "cc30b9e6-0ae1-4753-86cf-9b81717030c2.jpg",
          createdAt: "2023-11-04T20:00:00.000Z",
          updatedAt: "2023-11-04T20:00:00.000Z",
        },
      ],
      {}
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Photos", null, {})
  },
}
