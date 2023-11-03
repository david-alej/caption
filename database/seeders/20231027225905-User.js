"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Users",
      [
        {
          username: "rina.dark",
          password:
            "$2b$10$9O/NOVxM0f6BBtjcqcZtTeg3friTVI3GTbDooL1X5HbHEjYYmhHiq", //Password1234!
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
        {
          username: "Carkeys23307",
          password:
            "$2b$10$BH8A3qUWeTZaJ/YkyVplp.JcQ/EkHVa8YLAcEp4OkKTrZjgB8NXpe", //Calvin1234
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
        {
          username: "penguinlover",
          password:
            "$2b$10$29E11dGlGVqrO5jFyImKT.lgyNGOlunLLz8sMm2VQISZQTSRNWGhO", //Alaska456
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
        {
          username: "yomaster",
          password:
            "$2b$10$RrYRSU2.wwzo9onZ9i62CuET9up3m3n9PzS1XNPBQUQ71hdF5JBqi", //yoyoyo1Q
          isAdmin: true,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
      ],
      {}
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {})
  },
}
