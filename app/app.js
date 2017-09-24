const cron = require("cron")

const send_kanbanery_feed = (discord, channel, feeds) => {
  feeds.forEach(feed => {
    // using "<" and ">" around a link to disabled embedding
    const msg = `:triangular_flag_on_post: **${feed.title}**\n${feed.description}\n:point_right: <${feed.task}>\n---------------------------------------------------------------------------`
    discord.send(channel, msg)
  })
}

module.exports = (discord, kanbanery, holiday) => {
  const DISCORD_FLOX_CHANNEL = process.env.DISCORD_FLOX_CHANNEL
  const DISCORD_TRIVIA_CHANNEL = process.env.DISCORD_TRIVIA_CHANNEL

  const { KANBANERY_API_KEY, KANBANERY_HOST, KANBANERY_BOARD_URL, KANBANERY_SUMMARY_COLUMN_ID } = process.env

  const URL = `${KANBANERY_BOARD_URL}/log/?key=${KANBANERY_API_KEY}`

  const notifyHolidays = async (range = 2, unit = "weeks", send_only_if_holidays_are_upcoming = false) => {
    const upcoming = await holiday.next(range, unit)
    if (process.env.NODE_ENV !== "test") {
      console.log(range)
      console.log(unit)
      console.log(upcoming)
    }

    const upcoming_messages = upcoming.map(h => {
      return `- ${h.datum}: ${h.name}` + (h.hinweis != "" ? ` (${h.hinweis})` : "")
    }).join("\n")
    const message = upcoming.length ?
      `Holiday reminder: \nFor the next ${range} ${unit} we've got:\n${upcoming_messages}` :
      `Holiday reminder: \nFor the next ${range} ${unit} we've no upcoming holidays.`

    if (!upcoming.length && send_only_if_holidays_are_upcoming) return
    discord.send(DISCORD_TRIVIA_CHANNEL, message)
  }

  discord.listenTo(/^bot, .*holidays.*/, async (msg) => {
    if (msg.channel.name !== DISCORD_TRIVIA_CHANNEL) return
    if (msg.author.bot) return
    let range, unit

    // keep variables undefined if try fails. let notifyHolidays use its default params
    try {
      range = msg.content.match(/holidays.*(\d+)/)[1]
    } catch (e) { /**/ }

    try {
      unit = msg.content.match(/holidays.*(days?|weeks?|months?)/)[1]
    } catch (e) { /**/ }

    notifyHolidays(range, unit)
  })

  // Triggers on the first of every month
  new cron.CronJob({
    name: "kanbanery monthly summary",
    cronTime: "00 00 00 01 * *",
    start: true,
    async onTick() {
      const summary = await kanbanery.summary(KANBANERY_HOST, KANBANERY_SUMMARY_COLUMN_ID, KANBANERY_API_KEY)
      if (process.env.NODE_ENV !== "test") {
        console.log("CronJob triggered: printing kanbanery summary")
        console.log(summary)
      }
      discord.send(DISCORD_FLOX_CHANNEL, summary)
    }
  })

  // Triggers on every sunday
  new cron.CronJob({
    name: "weekly holiday reminder",
    cronTime: "00 00 00 * * 0",
    start: true,
    async onTick() {
      if (process.env.NODE_ENV !== "test") {
        console.log("CronJob triggered: printing upcoming holidays for the next 2 weeks")
      }
      notifyHolidays(2, "weeks", true)
    }
  })

  // Run every 5 minutes
  new cron.CronJob({
    name: "flox kanbanery rss feed",
    cronTime: "* */5 * * * *",
    start: true,
    runOnInit: true,
    async onTick() {
      if (process.env.NODE_ENV !== "test") {
        console.log("fetching...")
      }
      try {
        send_kanbanery_feed(discord, DISCORD_TRIVIA_CHANNEL, await kanbanery.fetch(URL))
      } catch (e) {
        console.error("Fetching failed. Reason: ", e)
      }
      if (process.env.NODE_ENV !== "test") {
        console.log("Fetching done.")
      }
    }
  })

}
