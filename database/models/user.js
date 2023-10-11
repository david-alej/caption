"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Photo, {
        foreignKey: "userId",
        as: "photos",
        onDelete: "CaSCADE",
      })

      this.hasMany(models.Caption, {
        foreignKey: "userId",
        as: "captions",
        onDelete: "CASCADE",
      })
    }
  }
  User.init(
    {
      username: DataTypes.STRING,
      password: DataTypes.STRING,
      isAdmin: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "User",
    }
  )
  return User
}
