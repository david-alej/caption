/* eslint-disable node/no-unpublished-require */
require("dotenv").config()
const https = require("node:https")

const axiosConfig = {
  baseURL: "https://localhost:",
  validateStatus: () => true,
}

if (process.env.NODE_ENV === "production") {
  axiosConfig.ca = "" //get CA certificate
} else {
  axiosConfig.httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  })
}

const chai = require("chai")

const expect = chai.expect

chai.use(require("chai-json-schema"))
chai.use(require("chai-datetime"))

const { faker } = require("@faker-js/faker")

const generateUsername = () => {
  const minLength = 4
  const maxLength = 20
  let username = faker.internet.userName()

  while (username.length < minLength || username.length > maxLength) {
    username = faker.internet.userName()
  }

  return username
}

const generatePassword = () => {
  const minLength = 8
  const maxLength = 20
  const uppercaseRegex = /[A-Z]/
  const numberRegex = /\d/

  let password = faker.internet.password()

  while (
    password.length < minLength ||
    password.length > maxLength ||
    !uppercaseRegex.test(password) ||
    !numberRegex.test(password)
  ) {
    password = faker.internet.password()
  }

  return password
}

module.exports = {
  axios: require("axios"),
  axiosConfig,
  initializeWebServer: require("../app").initializeWebServer,
  stopWebServer: require("../app").stopWebServer,
  expect,
  faker,
  generateUsername,
  generatePassword,
  fs: require("fs"),
  httpMocks: require("node-mocks-http"),
  httpStatusCodes: require("../util/index").httpStatusCodes,
  models: require("../database/models"),
  s3: require("../s3/index"),
  sinon: require("sinon"),
}
