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
            "$2b$10$w1fpDzFM5B5z8fSL7ZiAL.iNJ1WD4rwr7VGD6YVeteQpZtTi2sHEW", //alaska456
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: "yomaster",
          password:
            "$2b$10$FUJNndz74iZHvdHFau.1ROHVYuwk.lETTUrDTtl7Vk8L1ehTDiT2y", //yoyoyoyo
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
