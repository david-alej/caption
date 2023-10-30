"use strict"
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Votes", {
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      captionId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      value: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Votes")
  },
}
