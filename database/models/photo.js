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
      this.hasMany(models.Caption, {
        foreignKey: "photoId",
        as: "captions",
        onDelete: "CASCADE",
      })

      this.belongsTo(models.User, {
        foreignKey: "userId",
        as: "author",
        onDelete: "CASCADE",
      })
    }
  }
  Photo.init(
    {
      userId: DataTypes.INTEGER,
      photoName: DataTypes.STRING,
      photoFilename: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Photo",
    }
  )
  return Photo
}
