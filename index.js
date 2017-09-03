const kanbanery = require("./kanbanery_feed")
const Discord = require("discord.js")
const client = new Discord.Client()

const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const DISCORD_CHANNEL = process.env.DISCORD_CHANNEL

const KANBANERY_API_KEY = process.env.KANBANERY_API_KEY
const KANBANERY_BOARD_URL = process.env.KANBANERY_BOARD_URL
const FETCH_INTERVAL = (process.env.FETCH_INTERVAL || 5 * 60) * 1000 // default 5 minutes

const URL = `${KANBANERY_BOARD_URL}/log/?key=${KANBANERY_API_KEY}`
console.log("Flox-Bot start up")
console.log("RSS read interval: %d minutes (%d seconds)", FETCH_INTERVAL / 60 / 1000, FETCH_INTERVAL / 1000)
console.log("Using Kanbanery board: %s", URL)

const emotes = {}

const run = async () => {
  // init cache
  await kanbanery.fetch(URL)

  setInterval(async () => {
    console.log("fetching...")
    try {
      send(await kanbanery.fetch(URL))
    } catch (e) {
      console.error("Fetching failed. Reason: ", e)
    }
  }, FETCH_INTERVAL)
}

const send = (feeds) => {
  feeds.forEach(feed => {
    const msg = `:triangular_flag_on_post: **${feed.title}**\n${feed.description}\n:point_right: ${feed.task}\n---------------------------------------------------------------------------`
    client.channels.find("name", DISCORD_CHANNEL).send(msg)
  })
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)

  try {
    run()
  } catch (e) {
    console.error("Fetching failed. Reason: ", e)
  }
})

client.on("message", async (msg) => {
  emotes.feelsGoodMan = emotes.feelsGoodMan || client.emojis.find("name", "feelsGoodMan").toString()
  emotes.feelsBadMan = emotes.feelsBadMan || client.emojis.find("name", "feelsBadMan").toString()

  if (msg.channel.name !== DISCORD_CHANNEL || msg.author.bot === true) return
  const content = msg.content
  console.log("Command recognized: %s", content)

  if (content === "!fetch") {
    msg.channel.send(`yo gonna check it out ${emotes.feelsGoodMan}`)

    const feed = await kanbanery.fetch(URL)
    if (feed.length === 0) {
      msg.channel.send(`no mah' dude, nothin' new 'ere ${emotes.feelsBadMan}`)
      return
    }
    send(feed)
  }

  if (content.match(/^say/)) {
    msg.channel.send(content.replace(/^say/, ""))
  }
})

client.login(DISCORD_TOKEN)
