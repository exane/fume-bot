const { expect } = require("chai")
const Holiday = require("./holidays")
const request = require("request-promise-native")
const sinon = require("sinon")
const tk = require("timekeeper")
const fs = require("fs")

describe("holiday", () => {
  const sandbox = sinon.sandbox.create()
  const feiertage_api_response_2017_SL = fs.readFileSync("./fixtures/feiertage.api/response_2017_SL")
  const feiertage_api_response_2018_SL = fs.readFileSync("./fixtures/feiertage.api/response_2018_SL")

  beforeEach(() => {
    tk.travel(new Date("2017-09-09"))
    sandbox.stub(request, "get").returns(new Promise(res => res(feiertage_api_response_2017_SL)))
      .withArgs("http://feiertage.jarmedia.de/api/?jahr=2018&nur_land=SL").returns(new Promise(res => res(feiertage_api_response_2018_SL)))
  })

  afterEach(() => {
    sandbox.restore()
    tk.reset()
  })

  it("is a class", () => {
    expect(Holiday).to.be.a("function")
    expect(() => new Holiday).to.throw(Error)
    expect(new Holiday("SL")).to.be.an("object")
  })

  describe("#check", () => {
    let holiday
    beforeEach(() => {
      holiday = new Holiday("SL")
    })

    it("is a function", () => {
      expect(holiday.check).to.be.a("function")
    })

    it("requests api", async () => {
      await holiday.check()

      expect(request.get.calledOnce).to.be.true
      expect(request.get.getCall(0).args[0]).to.match(/feiertage.jarmedia.de\/api\//)
    })

    it("uses the current year", async () => {
      await holiday.check()
      expect(request.get.getCall(0).args[0]).to.match(/\/\?jahr=2017/)

      tk.travel(new Date("2010-09-09"))
      await holiday.check()
      expect(request.get.getCall(1).args[0]).to.match(/\/\?jahr=2010/)
    })

    it("uses the expected 'bundesland'", async () => {
      await holiday.check()
      expect(request.get.getCall(0).args[0]).to.match(/&nur_land=SL/)

      await new Holiday("RP").check()
      expect(request.get.getCall(1).args[0]).to.match(/&nur_land=RP/)
    })

    it("returns an array with upcoming holidays as objects(name, datum, hinweis)", async () => {
      const result = await holiday.check()

      tk.travel(new Date("2017-09-09"))
      expect(result).to.include.deep.members([
        { name: "Allerheiligen", datum: "2017-11-01", hinweis: "" },
        { name: "2. Weihnachtstag", datum: "2017-12-26", hinweis: "" },
      ])
      expect(result).to.not.include.deep.members([
        { name: "Neujahrstag", datum: "2017-01-01", hinweis: "" },
      ])

      tk.travel(new Date("2017-12-09"))
      const result2 = await holiday.check()
      expect(result2).to.include.deep.members([
        { name: "2. Weihnachtstag", datum: "2017-12-26", hinweis: "" },
      ])
      expect(result2).to.not.include.deep.members([
        { name: "Neujahrstag", datum: "2017-01-01", hinweis: "" },
        { name: "Allerheiligen", datum: "2017-11-01", hinweis: "" },
      ])
    })

    it("accepts a year param", async () => {
      await holiday.check(2018)
      expect(request.get.getCall(0).args[0]).to.match(/\/\?jahr=2018/)
    })

  })

  describe("#next", () => {
    let holiday

    beforeEach(() => {
      holiday = new Holiday("SL")
    })

    it("is a function", () => {
      expect(holiday.next).to.be.a("function")
    })

    it("returns the next holiday as an object(name, datum, hinweis)", async () => {
      expect(await holiday.next()).to.be.deep.eq([{
        name: "Tag der Deutschen Einheit",
        datum: "2017-10-03",
        hinweis: ""
      }])
    })

    it("returns object(name, datum, hinweis) of next year if no more holidays are upcoming in the current year", async () => {
      tk.travel(new Date("2017-12-31"))
      expect(await holiday.next()).to.be.deep.eq([{
        name: "Neujahrstag",
        datum: "2018-01-01",
        hinweis: ""
      }])
    })

    it("accepts a range param", async () => {
      tk.travel(new Date("2017-12-20"))
      expect(await holiday.next(2, "weeks")).to.be.deep.eq([
        { name: "1. Weihnachtstag", datum: "2017-12-25", hinweis: "" },
        { name: "2. Weihnachtstag", datum: "2017-12-26", hinweis: "" },
        { name: "Neujahrstag", datum: "2018-01-01", hinweis: "" },
      ])
    })

  })

})
