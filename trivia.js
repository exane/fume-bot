// https://opentdb.com/api.php?amount=1&category=18
//
// - should frequently ask questions in channel
// - accepts answers within 60 seconds (?)
// - only if someone is online
// - should say afterwards something like: "Yes! This wasn't so hard, was is?" based on difficulty (easy, medium, hard) and wether it was the right/wrong answer
const request = require("request-promise-native")
const Entities = require("html-entities"). AllHtmlEntities
const entities = new Entities()

const TARGET_URL = "https://opentdb.com/api.php?amount=1&category=18"

const store = {
  current_question: {}
}

const helper = {
  async send(discord_client, channel_name, msg) {
    return discord_client.channels.find("name", channel_name).send(msg)
  },
  on(discord_client, event, cb) {
    return discord_client.on(event, cb)
  },
  async message_send(discord_message, msg) {
    return discord_message.channel.send(msg)
  }
}

const start = async (discord_client, channel, time_limit, min_wait_time, max_wait_time) => {
  if (discord_client === undefined) throw Error("Missing argument discord_client")

  helper.on(discord_client, "message", (msg) => {
    if (msg.author.bot) return
    if (!store.current_question.running) {
      return
    }

    if (msg.content.toLowerCase() === store.current_question.correct_answer.toLowerCase()) {
      helper.message_send(msg, "correct answer")
      clearTimeout(store.current_question.timeout)
      nextQuestion(discord_client, channel, time_limit, min_wait_time, max_wait_time)
    }
  })

  ask(discord_client, channel, time_limit, min_wait_time, max_wait_time)
}

const nextQuestion = (discord_client, channel, time_limit, min_wait_time, max_wait_time) => {
  // TODO: message that question is over
  store.current_question.running = false

  const next_question_in_seconds = randomInterval(min_wait_time, max_wait_time)
  if (process.env.NODE_ENV !== "test") {
    console.log("current question time's up! Waiting for next question in %s minutes", next_question_in_seconds / 60)
  }

  setTimeout(() => {
    ask(discord_client, channel, time_limit)
  }, next_question_in_seconds * 1000)
}

const ask = async (discord_client, channel, time_limit, min_wait_time, max_wait_time) => {
  const { results } = JSON.parse(await request.get(TARGET_URL))

  store.current_question = results[0]
  store.current_question.question = entities.decode(store.current_question.question)
  store.current_question.correct_answer = entities.decode(store.current_question.correct_answer)
  store.current_question.running = true

  store.current_question.timeout = setTimeout(() => {
    nextQuestion(discord_client, channel, time_limit, min_wait_time, max_wait_time)
  }, time_limit)

  if (process.env.NODE_ENV !== "test") {
    console.log("Trivia - New question: ")
    console.log(store.current_question.question)
    console.log("Expected answer: %s", store.current_question.correct_answer)
  }

  helper.send(discord_client, channel, results[0].question)
}

const randomInterval = (min, max) => {
  min = parseInt(min)
  max = parseInt(max)
  return Math.floor(Math.random()*(max - min + 1) + min)
}

module.exports = {
  start,
  helper,
  store
}
