const request = require("request-promise-native")
const cheerio = require("cheerio")
const moment = require("moment")

const store = {
  cache: []
}

const cache = (feed = []) => {
  store.cache = [...store.cache, ...feed]

  // clear cache from previous days
  store.cache = store.cache.filter(c => c.date === date())
}

const date = (d) => {
  return moment(d).format("DD-MM-YYYY")
}

const onlyNewFeed = (feed = []) => {
  return feed.map(f => {
    const in_cache = store.cache.some(c => c.title === f.title && c.time === f.time && c.description === f.description)

    if (in_cache) return false
    return f
  }).filter(f => f && f.date === date())
}

const fetch = async (url) => {
  const req = await request.get(url)
  const $ = cheerio.load(req)
  const feed = $("#project-history > dd.loaded")
  const feed_date = $("#project-history dt:first-child a").text()
  const json_feed = onlyNewFeed(feed2json($, feed))

  if (date() !== date(feed_date)) {
    // No need to parse old entries
    return []
  }

  if (process.env.NODE_ENV !== "test") {
    console.log("New feed: ")
    console.log(json_feed)
  }

  cache(json_feed)

  return json_feed
}

const feed2json = ($, html) => {
  const list = $(html).find("li")

  return list.map((i, e) => {
    return {
      avatar: $(e).find(".avatar img").attr("src"),
      title: $(e).find(".text h5").text(),
      description: $(e).find(".text p").text(),
      task: $(e).find(".text .time a").attr("href"),
      time: $(e).find(".text .time").text(),
      date: date()
    }
  }).get()
}

const summary = async (host, column_id, api_token) => {
  if (!host) throw Error("missing host, column_id and api_token param")
  if (!column_id) throw Error("missing column_id and api_token param")
  if (!api_token) throw Error("missing api_token param")

  const tasks = JSON.parse(await request.get(`https://${host}/api/v1/columns/${column_id}/tasks.json?api_token=${api_token}`))

  const target_date = moment().subtract(1, "month").format("MMMM/YYYY")
  return `Summary for ${target_date}\nTickets done: ${tasks.length}\n - ` + (tasks.map(t => t.title).join("\n - "))
    + "\n\nPlease archive the tickets now to keep the next summary as accurate as possible."
}

module.exports = {
  fetch,
  summary,
  store
}
