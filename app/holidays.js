const request = require("request-promise-native")
const moment = require("moment")

module.exports = class Holiday {

  constructor(bundesland) {
    if (!bundesland) {
      throw Error("param Bundesland is missing")
    }

    this.bundesland = bundesland
  }

  async check(year = new Date().getFullYear()) {
    const result = JSON.parse(await request.get(`http://feiertage.jarmedia.de/api/?jahr=${year}&nur_land=${this.bundesland}`))
    const current_date = moment().format("YYYY-MM-DD")

    return Object.keys(result).map(name => {
      return { name, datum: result[name].datum, hinweis: result[name].hinweis }
    }).filter(o => current_date < o.datum)
  }

  async next(num, unit = "weeks") {
    if (num) {
      const range = moment().add(num, unit).format("YYYY-MM-DD")
      return [...await this.check(), ...await this.check(new Date().getFullYear() + 1)].filter(o => {
        return o.datum < range
      })
    }
    return [(await this.check())[0] || (await this.check(new Date().getFullYear() + 1))[0]]
  }

}
