require("dotenv").config()

const kanbanery = require("./app/kanbanery_feed")
const Discord = require("discord.js")
const client = new Discord.Client()
const DiscordWrapper = require("./app/discord")
const Holiday = require("./app/holidays")
const app = require("./app/app")
//TODO refactor with DiscordWrapper

const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const DISCORD_FLOX_CHANNEL = process.env.DISCORD_FLOX_CHANNEL
const DISCORD_TRIVIA_CHANNEL = process.env.DISCORD_TRIVIA_CHANNEL
const DISCORD_FUME_CHANNEL = process.env.DISCORD_FUME_CHANNEL

// const { TRIVIA_TIME_LIMIT, TRIVIA_TIME_UNTIL_NEXT_QUESTION_MIN, TRIVIA_TIME_UNTIL_NEXT_QUESTION_MAX } = process.env

const { KANBANERY_API_KEY, KANBANERY_HOST, PROJECT_ID } = process.env
const KANBANERY_BOARD_URL = `https://${KANBANERY_HOST}/projects/${PROJECT_ID}`
const FETCH_INTERVAL = (process.env.FETCH_INTERVAL || 5 * 60) * 1000 // default 5 minutes

const URL = `${KANBANERY_BOARD_URL}/log/?key=${KANBANERY_API_KEY}`
console.log("Flox-Bot start up")
console.log("RSS read interval: %d minutes (%d seconds)", FETCH_INTERVAL / 60 / 1000, FETCH_INTERVAL / 1000)
console.log("Using Kanbanery board: %s", URL)
console.log("Using discord channel for kanbanery: %s", DISCORD_FLOX_CHANNEL)
console.log("Using discord channel for trivia: %s", DISCORD_TRIVIA_CHANNEL)
// console.log("Trivia time limit: %s minutes", TRIVIA_TIME_LIMIT / 60)
// console.log("Trivia wait until next question: between %s minutes and %s minutes", TRIVIA_TIME_UNTIL_NEXT_QUESTION_MIN / 60, TRIVIA_TIME_UNTIL_NEXT_QUESTION_MAX / 60)

const emotes = {}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
  const discord = new DiscordWrapper(client)
  const holiday = new Holiday("SL")
  app(discord, kanbanery, holiday)
})

client.on("message", async (msg) => {
  emotes.feelsGoodMan = emotes.feelsGoodMan || client.emojis.find("name", "feelsGoodMan").toString()
  emotes.feelsBadMan = emotes.feelsBadMan || client.emojis.find("name", "feelsBadMan").toString()

  if (msg.channel.name === DISCORD_FUME_CHANNEL) {
    onFumeMessage(msg)
  }

  if (msg.channel.name !== DISCORD_FLOX_CHANNEL || msg.author.bot === true) return
  const content = msg.content
  console.log("Command recognized: %s", content)

  if (content === "!fetch") {
    msg.channel.send(`yo gonna check it out ${emotes.feelsGoodMan}`)

    const feed = await kanbanery.fetch(URL)
    if (feed.length === 0) {
      msg.channel.send(`no mah' dude, nothin' new 'ere ${emotes.feelsBadMan}`)
      return
    }
    // TODO: move to app.js
    // send(feed)
  }

  if (content.match(/^say/)) {
    msg.channel.send(content.replace(/^say/, ""))
  }
})

const onFumeMessage = (msg) => {
  if (msg.author.bot === false) {
    sassyComment(msg.channel)
  }
}

const sassyComment = (channel) => {
  const emotes = [
    "feelsGoodMan", "feelsBadMan", "timCreep", "NotLikeThis",
    "feelsWtfMan", "LUL", "timW00t", "thinking"
  ]

  //should bot being sassy?
  const being_sassy = (Math.random()*100 | 0) === 42
  if (being_sassy) {
    const random_emote = emotes[(Math.random() * emotes.length) | 0]
    channel.send(client.emojis.find("name", random_emote).toString())
  }
}

client.login(DISCORD_TOKEN)
