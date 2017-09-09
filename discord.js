module.exports = class DiscordWrapper {

  constructor(client) {
  
  }

}


//testing

const discord = new DiscordWrapper(discord_client)

// discord.listenTo("bot, how are holidays the next 2 weeks?", async () => {
// bot, how are holidays the next 2 weeks?
discord.listenTo(/^bot, .*holidays.*/, async (msg) => {
  const range_number = msg.match(//)
  const upcoming = await holiday.next(2, "weeks")

  this.send("fume", "answer blabla", upcoming.map(...))
})
