"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Users",
      [
        {
          username: "rina.dark",
          password: "Password1234!",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: "Carkeys23307",
          password: "Calvin1234",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: "penguinlover",
          password: "alaska456",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: "yomaster",
          password: "yoyoyoyo",
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
