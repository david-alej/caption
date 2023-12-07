const redis = require("redis")

class Redis {
  constructor() {
    this.host = process.env.REDIS_HOST || "localhost"
    this.port = process.env.REDIS_PORT || "6379"
    this.connected = false
    this.client = null
  }
  async getConnection() {
    if (this.connected) return this.client
    else {
      this.client = redis.createClient({
        host: this.host,
        port: this.port,
        detect_buffers: true,
      })

      this.client.on("error", (error) => console.error(`Error : ${error}`))

      this.client.on("ready", () => console.log("Redis is ready"))

      try {
        console.log("connecting new redis client!\n")

        await this.client.connect()

        this.connected = true
      } catch (err) {
        console.log("redis connect exception caught: " + err)

        return null
      }

      return this.client
    }
  }
}

module.exports = new Redis()
