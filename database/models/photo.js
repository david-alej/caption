"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class Photo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Photo.hasMany(models.Caption, {
        foreignKey: "photoId",
        as: "captions",
        onDelete: "CASCADE",
      })

      Photo.belongsTo(models.User, {
        foreignKey: "userId",
        as: "author",
        onDelete: "CASCADE",
      })
    }
  }
  Photo.init(
    {
      userId: DataTypes.INTEGER,
      title: DataTypes.STRING,
      filename: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Photo",
    }
  )
  return Photo
}
