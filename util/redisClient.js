const redis = require("redis")

let redisClient
;(async () => {
  redisClient = redis.createClient()

  redisClient.on("error", (error) => console.error(`Error : ${error}`))

  redisClient.on("ready", () => console.log("Redis is ready"))

  await redisClient.connect()
})()

module.exports = redisClient
