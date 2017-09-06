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
  async send(channel_name, msg) {
    return params.discord_client.channels.find("name", channel_name).send(msg)
  },
  on(event, cb) {
    return params.discord_client.on(event, cb)
  },
  async message_send(discord_message, msg) {
    return discord_message.channel.send(msg)
  }
}

let params
const start = async (discord_client, channel, time_limit, min_wait_time, max_wait_time) => {
  if (discord_client === undefined) throw Error("Missing argument discord_client")

  params = {
    discord_client,
    channel,
    time_limit,
    min_wait_time,
    max_wait_time
  }

  helper.on("message", onMessageReceive)

  return ask()
}

const onMessageReceive = async (msg) => {
  if (msg.author.bot) return
  if (!store.current_question.running) {
    return
  }

  if (msg.content.toLowerCase() === store.current_question.correct_answer.toLowerCase()) {
    store.current_question.solved = true
    await helper.message_send(msg, "correct answer")
    clearTimeout(store.current_question.timeout)
    return nextQuestion()
  }
}

const nextQuestion = async () => {
  // TODO: message that question is over
  store.current_question.running = false

  const next_question_in_seconds = randomInterval(params.min_wait_time, params.max_wait_time)
  if (!store.current_question.solved) {
    await helper.send(params.channel, "Time's up!")

    if (process.env.NODE_ENV !== "test") {
      console.log("current question time's up!")
    }
  }

  waitForNextQuestion(next_question_in_seconds)
}

const waitForNextQuestion = (next_question_in_seconds) => {
  console.log("Waiting for next question in %s minutes", next_question_in_seconds / 60)

  setTimeout(() => {
    ask()
  }, next_question_in_seconds * 1000)
}

const ask = async () => {
  const { results } = JSON.parse(await request.get(TARGET_URL))

  store.current_question = results[0]
  store.current_question.question = entities.decode(store.current_question.question)
  store.current_question.correct_answer = entities.decode(store.current_question.correct_answer)
  store.current_question.running = true
  store.current_question.solved = false

  store.current_question._next_question_cb = () => {
    return nextQuestion()
  }
  store.current_question.timeout = setTimeout(store.current_question._next_question_cb, params.time_limit)

  const answers = [...store.current_question.incorrect_answers, store.current_question.correct_answer]
  const question = `${store.current_question.question}\n- ${answers.join("\n- ")}`

  if (process.env.NODE_ENV !== "test") {
    console.log("Trivia - New question: ")
    console.log(store.current_question.question)
    console.log("Expected answer: %s", store.current_question.correct_answer)
  }

  return helper.send(params.channel, question)
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
