const { expect } = require("chai")
const app = require("./app")
const sinon = require("sinon")
const DiscordWrapper = require("./discord.js")
const cron = require("cron")
const tk = require("timekeeper")

const holiday_interface = {
  async next() { },
}
const kanbanery_interface = {
  async fetch() { },
  async summary() { },
}

describe("App", () => {
  const sandbox = sinon.sandbox.create()
  let discord

  beforeEach(() => {
    process.env.DISCORD_TRIVIA_CHANNEL = "trivia"
    process.env.WEATHER_API_KEY = "xyz"
    discord = new DiscordWrapper({})
    sandbox.stub(discord, "listenTo")
    sandbox.stub(discord, "send")
    sandbox.stub(kanbanery_interface, "fetch").returns(new Promise(res => res([])))
    sandbox.stub(kanbanery_interface, "summary").returns(new Promise(res => res("Kanbanery Summary")))
    sandbox.stub(holiday_interface, "next").returns(new Promise(res => res([{
      name: "Tag der Deutschen Einheit",
      datum: "2017-10-03",
      hinweis: "hinweis"
    }])))
  })

  afterEach(() => {
    sandbox.restore()
    delete process.env.DISCORD_TRIVIA_CHANNEL
  })

  it("is a function", () => {
    expect(app).to.be.a("function")
    app(discord, kanbanery_interface, holiday_interface)
  })

  it("listens to holiday requests", () => {
    app(discord, kanbanery_interface, holiday_interface)

    expect(discord.listenTo.called).to.be.true
    expect(discord.listenTo.getCall(0).args[0].toString()).to.equal("/^bot, .*holidays?.*/")
    expect(discord.listenTo.getCall(0).args[1]).to.be.a("function")
  })

  it("sends holiday reminder", async () => {
    tk.travel(new Date("2017-09-23"))
    app(discord, kanbanery_interface, holiday_interface)

    expect(discord.send.calledOnce).to.be.false

    const trigger_holiday_request = discord.listenTo.getCall(0).args[1]

    const msg_interface = {
      channel: { name: "trivia" },
      author: { bot: false },
      content: "bot, holidays"
    }
    await trigger_holiday_request(msg_interface)

    expect(holiday_interface.next.calledOnce).to.be.true
    expect(holiday_interface.next.getCall(0).args).to.include.members([2, "weeks"])

    expect(discord.send.calledOnce).to.be.true
    expect(discord.send.getCall(0).args).to.include.members([
      "trivia",
      "Holiday reminder for 23.09.2017! \nFor the next 2 weeks we've got:\n- 03.10.2017 (Tuesday): Tag der Deutschen Einheit (hinweis)"
    ])

    tk.reset()
  })

  it("sends holiday reminder with custom range and unit", async () => {
    app(discord, kanbanery_interface, holiday_interface)

    const trigger_holiday_request = discord.listenTo.getCall(0).args[1]

    const msg_interface = {
      channel: { name: "trivia" },
      author: { bot: false },
      content: "bot, give me the holidays for the next 4 months"
    }
    await trigger_holiday_request(msg_interface)

    expect(holiday_interface.next.calledOnce).to.be.true
    expect(holiday_interface.next.getCall(0).args).to.include.members(["4", "months"])
  })

  it("sends holiday reminder with another custom range and unit", async () => {
    app(discord, kanbanery_interface, holiday_interface)

    const trigger_holiday_request = discord.listenTo.getCall(0).args[1]

    const msg_interface = {
      channel: { name: "trivia" },
      author: { bot: false },
      content: "bot, give me the holidays for the next 12 months pls"
    }
    await trigger_holiday_request(msg_interface)

    expect(holiday_interface.next.calledOnce).to.be.true
    expect(holiday_interface.next.getCall(0).args).to.include.members(["12", "months"])
  })

  it("does not send holiday reminder with bot as user", async () => {
    app(discord, kanbanery_interface, holiday_interface)

    expect(discord.send.calledOnce).to.be.false

    const trigger_holiday_request = discord.listenTo.getCall(0).args[1]

    const msg_interface = {
      channel: { name: "trivia" },
      author: { bot: true },
      content: "bot, holidays"
    }
    await trigger_holiday_request(msg_interface)

    expect(discord.send.calledOnce).to.be.false
  })

  it("does not send holiday reminder with wrong channel", async () => {
    app(discord, kanbanery_interface, holiday_interface)

    expect(discord.send.calledOnce).to.be.false

    const trigger_holiday_request = discord.listenTo.getCall(0).args[1]

    const msg_interface = {
      channel: { name: "wrong" },
      author: { bot: false },
      content: "bot, holidays"
    }
    await trigger_holiday_request(msg_interface)

    expect(discord.send.calledOnce).to.be.false
  })

  xit("uses a cronjob to print a monthly kanbanery summary", async () => {
    sandbox.spy(cron, "CronJob")
    app(discord, kanbanery_interface, holiday_interface)

    const kanbanery_summary_job = cron.CronJob.args.find((arg) => {
      if (arg[0].name === "kanbanery monthly summary") return arg[0]
    })

    const [{ cronTime, start, onTick }] = kanbanery_summary_job
    expect(cronTime).to.eq("00 00 00 01 * *")
    expect(start).to.eq(true)

    await onTick()

    expect(kanbanery_interface.summary.calledOnce).to.be.true

    expect(discord.send.calledOnce).to.be.true
  })

  xit("uses a cronjob to print a weekly holiday reminder", async () => {
    sandbox.spy(cron, "CronJob")
    app(discord, kanbanery_interface, holiday_interface)

    const holiday_reminder_job = cron.CronJob.args.find((arg) => {
      if (arg[0].name === "weekly holiday reminder") return arg[0]
    })

    const [{ cronTime, start, onTick }] = holiday_reminder_job
    expect(cronTime).to.eq("00 00 00 * * 0")
    expect(start).to.eq(true)

    await onTick()

    expect(holiday_interface.next.calledOnce).to.be.true

    expect(discord.send.calledOnce).to.be.true
  })

  xit("uses a cronjob to print a rss feed of flox kanbanery board every 5 minutes", async () => {
    sandbox.spy(cron, "CronJob")
    kanbanery_interface.fetch.restore()
    sandbox.stub(kanbanery_interface, "fetch").returns(new Promise(res => res([{
      title: "",
      description: "",
      task: ""
    }])))
    app(discord, kanbanery_interface, holiday_interface)

    const job = cron.CronJob.args.find((arg) => {
      if (arg[0].name === "flox kanbanery rss feed") return arg[0]
    })

    const [{ cronTime, start, runOnInit, onTick }] = job
    expect(cronTime).to.eq("0 */5 * * * *")
    expect(start).to.eq(true)
    expect(runOnInit).to.eq(true)

    expect(kanbanery_interface.fetch.calledOnce).to.be.true

    await onTick()

    expect(kanbanery_interface.fetch.calledTwice).to.be.true

    expect(discord.send.calledTwice).to.be.true
  })

})
