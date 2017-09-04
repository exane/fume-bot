const { expect } = require("chai")
const request = require("request-promise-native")
const trivia = require("./trivia")
const sinon = require("sinon")
const fs = require("fs")

const opentdb_api_fixture = fs.readFileSync("./fixtures/opentdb/api")
const opentdb_api_fixture_json = JSON.parse(opentdb_api_fixture)

const discord_interface = {
  client: {
    on: () => {},
    channels: {
      find: () => {}
    }
  },
  message: {
    content: "",
    author: {
      bot: false
    },
    channel: {
      send: () => {}
    }
  }
}

describe("trivia", () => {

  describe("#start", () => {
    let request_get_stub

    beforeEach(() => {
      request_get_stub = sinon.stub(request, "get")
      request_get_stub.withArgs("https://opentdb.com/api.php?amount=1&category=18").returns(opentdb_api_fixture)

      sinon.spy(discord_interface.client, "on")
      sinon.stub(discord_interface.client.channels, "find").returns(sinon.stub({ send: () => {} }))
      sinon.spy(discord_interface.message.channel, "send")
    })

    afterEach(() => {
      request_get_stub.restore()
      discord_interface.client.on.restore()
      discord_interface.client.channels.find.restore()
      discord_interface.message.channel.send.restore()
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

      expect(discord_interface.client.channels.find().send.calledOnce).to.be.true
      expect(discord_interface.client.channels.find().send.args[0][0]).to.be.eq(opentdb_api_fixture_json.results[0].question)
    })

    it("awaits an answer after sending a question", async () => {
      await trivia.start(discord_interface.client)

      expect(discord_interface.client.on.calledOnce).to.be.true
      expect(discord_interface.client.on.args[0][0]).to.eq("message")
    })

    it("evaluates the answer to incorrect", async () => {
      await trivia.start(discord_interface.client)

      // trigger "message" callback
      discord_interface.client.on.args[0][1](Object.assign(discord_interface.message, { content: "wrong answer" }))

      expect(discord_interface.message.channel.send.called).to.be.false
    })

    it("evaluates the answer to correct", async () => {
      const expected_answer = opentdb_api_fixture_json.results[0].correct_answer

      await trivia.start(discord_interface.client)

      // trigger "message" callback
      discord_interface.client.on.args[0][1](Object.assign(discord_interface.message, { content: expected_answer }))

      expect(discord_interface.message.channel.send.args[0][0]).to.be.eq("correct answer")
    })

    it("should use a specified channel", async () => {
      const channel = "test-channel"
      await trivia.start(discord_interface.client, channel)

      expect(discord_interface.client.channels.find.args[0]).to.have.members(["name", channel])
    })

    it("should ignore bot messages", async () => {
      await trivia.start(discord_interface.client)

      const msg = JSON.parse(JSON.stringify(discord_interface.message))

      msg.author.bot = true

      // trigger "message" callback
      discord_interface.client.on.args[0][1](msg)

      expect(discord_interface.message.channel.send.called).to.be.false
    })

    it("should deny any answers", async () => {
      await trivia.start(discord_interface.client)

      trivia.store.current_question.running = false

      // trigger "message" callback
      discord_interface.client.on.args[0][1](discord_interface.message)

      expect(discord_interface.message.channel.send.called).to.be.false
    })

    it("should set running to false if question is correct", async () => {
      const expected_answer = opentdb_api_fixture_json.results[0].correct_answer

      await trivia.start(discord_interface.client, "test", 200)
      expect(trivia.store.current_question.running).to.be.true

      // trigger "message" callback
      discord_interface.client.on.args[0][1](Object.assign(discord_interface.message, { content: expected_answer }))

      expect(trivia.store.current_question.running).to.be.false
    })

    it("should send message if current question is over")

    it("compares case-insensitive", async () => {
      const expected_answer = "Central Processing Unit"

      await trivia.start(discord_interface.client)

      trivia.store.current_question.correct_answer = expected_answer

      // trigger "message" callback
      discord_interface.client.on.args[0][1](Object.assign(discord_interface.message, { content: expected_answer.toLowerCase() }))

      expect(discord_interface.message.channel.send.args[0][0]).to.be.eq("correct answer")
    })
  })

})
