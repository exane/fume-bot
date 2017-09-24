module.exports = class DiscordWrapper {

  constructor(client) {
    if (!client) throw Error("Missing discord_client param")
    this.client = client
    this._listening = false
    this._message_map = []
  }

  listenTo(message, callback) {
    if (!this._listening) {
      this.client.on("message", (msg) => {
        this._message_map.forEach((map) => {
          msg.content.match(map.message) ? map.callback(msg) : ""
        })
      })
      this._listening = true
    }

    this._message_map.push({message, callback})
  }

  async send(channel_name, msg) {
    return this.client.channels.find("name", channel_name).send(msg)
  }

  // on(event, cb) {
  //   return this.client.on(event, cb)
  // }

  // async message_send(discord_message, msg) {
  //   return discord_message.channel.send(msg)
  // }

}

// testing

// const discord = new DiscordWrapper(discord_client)

// bot, how are holidays the next 2 weeks?

// discord.listenTo(/^bot, .*holidays.*/, async (msg) => {
//   const range_number = msg.match(/holidays.*\d+/)
//   const unit = msg.match(/holidays.*(days|weeks)/)
//   const upcoming = await holiday.next(2, "weeks")

//   this.send("fume", `Holiday reminder: \nFor the next ${range_number} ${unit} we've got:\n- ` + upcoming.map(h => {
//     return `${h.datum}: ${h.name}` + h.hinweis ? ` (${h.hinweis})` : ""
//   }).join("\n- "))
// })
//
//
//client.on("message", async (msg) => {
//  if (msg.channel.name !== DISCORD_FLOX_CHANNEL || msg.author.bot === true) return
//  const content = msg.content
//  msg.channel.send(`yo gonna check it out ${emotes.feelsGoodMan}`)
