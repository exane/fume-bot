const { expect } = require("chai")
const WeatherAPI = require("./weather")
const fs = require("fs")
const sinon = require("sinon")
const request = require("request-promise-native")
const moment = require("moment")

describe("WeatherAPI", () => {
  const API_KEY = "xyz"
  const sandbox = sinon.sandbox.create()
  const weather_st_wendel = fs.readFileSync("./fixtures/weather/st_wendel")

  let weatherApi

  beforeEach(() => {
    weatherApi = new WeatherAPI(API_KEY)
    sandbox.stub(request, "get")
      .returns(new Promise(res => res(weather_st_wendel)))
  })

  afterEach(() => {
    sandbox.restore()
  })

  it("is a class", () => {
    expect(WeatherAPI).to.be.a("function")
    expect(() => new WeatherAPI).to.throw(Error)
    expect(new WeatherAPI(API_KEY)).to.be.an("object")
  })

  it("#getWeather requires a city code", async () => {
    const result = await weatherApi.getWeather(weatherApi.cityId.ST_WENDEL.id)
    expect(result.cnt).to.be.eql(40)
    expect(result.city.id).to.be.eql(weatherApi.cityId.ST_WENDEL.id)
  })

  it("#forecast returns formatted 5 days forecast as string", async () => {
    const result = await weatherApi.forecast(weatherApi.cityId.ST_WENDEL.id)
    expect(result).to.have.a.lengthOf(5)

    expect(result).to.be.eql([
      "Monday, January 28, 19:00: 0.89C° | Rain (light rain)",
      "Tuesday, January 29, 19:00: -4.4C° | Clouds (broken clouds)",
      "Wednesday, January 30, 19:00: 0.2C° | Snow (light snow)",
      "Thursday, January 31, 19:00: 2.18C° | Rain (moderate rain)",
      "Friday, February 1, 19:00: 3.57C° | Rain (light rain)"
    ])
  })

  it("reports all cities", async () => {
    const reports = await weatherApi.report()

    expect(reports).to.be.eql(
      `Daily weather forecast! (${moment().format("dddd, DD.MM.YYYY")})
St. Wendel

- Monday, January 28, 19:00: 0.89C° | Rain (light rain)
- Tuesday, January 29, 19:00: -4.4C° | Clouds (broken clouds)
- Wednesday, January 30, 19:00: 0.2C° | Snow (light snow)
- Thursday, January 31, 19:00: 2.18C° | Rain (moderate rain)
- Friday, February 1, 19:00: 3.57C° | Rain (light rain)

Neubrücke

- Monday, January 28, 19:00: 0.89C° | Rain (light rain)
- Tuesday, January 29, 19:00: -4.4C° | Clouds (broken clouds)
- Wednesday, January 30, 19:00: 0.2C° | Snow (light snow)
- Thursday, January 31, 19:00: 2.18C° | Rain (moderate rain)
- Friday, February 1, 19:00: 3.57C° | Rain (light rain)

Saarbrücken

- Monday, January 28, 19:00: 0.89C° | Rain (light rain)
- Tuesday, January 29, 19:00: -4.4C° | Clouds (broken clouds)
- Wednesday, January 30, 19:00: 0.2C° | Snow (light snow)
- Thursday, January 31, 19:00: 2.18C° | Rain (moderate rain)
- Friday, February 1, 19:00: 3.57C° | Rain (light rain)`
    )
  })

})
