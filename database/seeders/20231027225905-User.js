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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: "Carkeys23307",
          password:
            "$2b$10$BH8A3qUWeTZaJ/YkyVplp.JcQ/EkHVa8YLAcEp4OkKTrZjgB8NXpe", //Calvin1234
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: "penguinlover",
          password:
            "$2b$10$29E11dGlGVqrO5jFyImKT.lgyNGOlunLLz8sMm2VQISZQTSRNWGhO", //Alaska456
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: "yomaster",
          password:
            "$2b$10$RrYRSU2.wwzo9onZ9i62CuET9up3m3n9PzS1XNPBQUQ71hdF5JBqi", //yoyoyo1Q
          isAdmin: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {})
  },
}
