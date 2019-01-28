const request = require("request-promise-native")
const moment = require("moment-timezone")

module.exports = class WeatherAPI {
  constructor(API_KEY) {
    if (!API_KEY) {
      throw Error("Missing api key")
    }

    this.cityId = {
      ST_WENDEL: { name: "St. Wendel", id: 2841463 },
      NEUBRUECKE: { name: "Neubrücke", id: 2866104 },
      SAARBRUECKEN: { name: "Saarbrücken", id: 3249068 }
    }

    this.apiUrl = "https://api.openweathermap.org/data/2.5"
    this.apiKey = API_KEY
  }

  async getWeather(cityId) {
    if (!cityId) {
      return Promise.reject(Error("#getWeather: missing city id"))
    }

    try {
      return JSON.parse(await request.get(`${this.apiUrl}/forecast?id=${cityId}&APPID=${this.apiKey}&units=metric`))
    } catch (error) {
      console.error(error)
      return { error }
    }
  }

  async forecast(cityId) {
    try {
      const data = await this.getWeather(cityId)
      const days = data.list
        .filter((_element, index) => (index % 8) == 0)
        .map((day) => {
          const date = moment(day.dt * 1000).tz("Europe/Berlin").format("dddd, MMMM D, HH:mm")
          return `${date}: ${day.main.temp}C° | ${day.weather[0].main} (${day.weather[0].description})`
        })
      return days
    } catch (error) {
      return { error }
    }
  }

  async report() {
    let reports = Object.entries(this.cityId).map(async ([, { name, id }]) => {
      return new Promise(async (res) => {
        res({ city: name, forecast: await this.forecast(id) })
      })
    })

    reports = await Promise.all(reports)

    reports = reports.map(({ city, forecast }) => {
      return `${city}\n\n- ${forecast.join("\n- ")}`
    }).join("\n\n")

    return `Daily weather forecast! (${moment().format("dddd, DD.MM.YYYY")})\n${reports}`
  }
}