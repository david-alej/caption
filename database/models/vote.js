"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class Vote extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Vote.belongsTo(models.User, {
        foreignKey: "userId",
        as: "author",
      })

      Vote.belongsTo(models.Caption, {
        foreignKey: "captionId",
        as: "caption",
      })
    }
  }
  Vote.init(
    {
      userId: DataTypes.INTEGER,
      captionId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Vote",
    }
  )
  return Vote
}
