"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class Caption extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, {
        foreignKey: "userId",
        as: "author",
      })

      this.belongsTo(models.Photo, {
        foreignKey: "photoId",
        as: "photo",
      })
    }
  }
  Caption.init(
    {
      userId: DataTypes.INTEGER,
      photoId: DataTypes.INTEGER,
      captionText: DataTypes.STRING,
      votes: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Caption",
    }
  )
  return Caption
}
