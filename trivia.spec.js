const { expect } = require("chai")
const request = require("request-promise-native")
const trivia = require("./trivia")
const sinon = require("sinon")
const fs = require("fs")

const opentdb_api_fixture = fs.readFileSync("./fixtures/opentdb/api")
const opentdb_api_fixture_json = JSON.parse(opentdb_api_fixture)

const discord_interface = {
  client: {
    on() {},
    channels: {
      find() {
        return { send() { return new Promise(res => res())} }
      }
    }
  },
  message: {
    content: "",
    author: {
      bot: false
    },
    channel: {
      send() { return new Promise(res => res()) }
    }
  }
}

const trigger_message_callback = (msg) => trivia.helper.on.getCall(0).args[2](msg)

describe("trivia", () => {

  describe("#start", () => {
    let request_get_stub, send_stub, on_stub, message_send_stub

    beforeEach(() => {
      request_get_stub = sinon.stub(request, "get")
      request_get_stub.withArgs("https://opentdb.com/api.php?amount=1&category=18").returns(opentdb_api_fixture)

      send_stub = sinon.spy(trivia.helper, "send")
      on_stub = sinon.spy(trivia.helper, "on")
      message_send_stub = sinon.spy(trivia.helper, "message_send")
    })

    afterEach(() => {
      request_get_stub.restore()
      send_stub.restore()
      on_stub.restore()
      message_send_stub.restore()
    })

    it("is a function", () => {
      expect(trivia.start).to.be.a("function")
    })

    it("requests open trivia db", async () => {
      await trivia.start(discord_interface.client)

      expect(request_get_stub.calledOnce).to.be.true
      expect(request_get_stub.args[0][0]).to.match(/opentdb/)
    })

    it("requires discord channel as argument", (done) => {
      trivia.start()
        .then(() => {
          return done(Error("Should have thrown error for missing argument"))
        })
        .catch(() => {
          return done()
        })
    })

    it("sends the question to discord channel", async () => {
      await trivia.start(discord_interface.client)

      expect(trivia.helper.send.calledOnce).to.be.true

      const sent_message = trivia.helper.send.getCall(0).args[2]
      expect(sent_message).to.be.eq(opentdb_api_fixture_json.results[0].question)
    })

    it("awaits an answer after sending a question", async () => {
      await trivia.start(discord_interface.client)

      expect(trivia.helper.on.calledOnce).to.be.true

      const eventname = trivia.helper.on.getCall(0).args[1]
      expect(eventname).to.eq("message")
    })

    it("evaluates the answer to incorrect", async () => {
      await trivia.start(discord_interface.client)

      trigger_message_callback(Object.assign(discord_interface.message, { content: "wrong answer" }))

      expect(trivia.helper.message_send.called).to.be.false
    })

    it("evaluates the answer to correct", async () => {
      const expected_answer = opentdb_api_fixture_json.results[0].correct_answer

      await trivia.start(discord_interface.client)

      trigger_message_callback(Object.assign(discord_interface.message, { content: expected_answer }))

      expect(trivia.helper.message_send.getCall(0).args[0]).to.be.deep.equal(discord_interface.message)
      expect(trivia.helper.message_send.getCall(0).args[1]).to.be.eq("correct answer")
    })

    it("should use a specified channel", async () => {
      const channel = "test-channel"
      await trivia.start(discord_interface.client, channel)

      expect(trivia.helper.send.getCall(0).args[1]).to.be.eq(channel)
    })

    it("should ignore bot messages", async () => {
      await trivia.start(discord_interface.client)

      const msg = JSON.parse(JSON.stringify(discord_interface.message))

      msg.author.bot = true

      trigger_message_callback(msg)

      expect(trivia.helper.message_send.called).to.be.false
    })

    it("should deny any answers", async () => {
      await trivia.start(discord_interface.client)

      trivia.store.current_question.running = false

      trigger_message_callback(discord_interface.message)

      expect(trivia.helper.message_send.called).to.be.false
    })

    it("should set running to false if question is correct", async () => {
      const expected_answer = opentdb_api_fixture_json.results[0].correct_answer

      await trivia.start(discord_interface.client, "test", 200)
      expect(trivia.store.current_question.running).to.be.true

      trigger_message_callback(Object.assign(discord_interface.message, { content: expected_answer }))

      expect(trivia.store.current_question.running).to.be.false
    })

    it("should send message if current question is over")

    it("compares case-insensitive", async () => {
      const expected_answer = "Central Processing Unit"

      await trivia.start(discord_interface.client)

      trivia.store.current_question.correct_answer = expected_answer

      trigger_message_callback(Object.assign(discord_interface.message, { content: expected_answer.toLowerCase() }))

      expect(trivia.helper.message_send.getCall(0).args[1]).to.be.eq("correct answer")
    })
  })

})
