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

module.exports = {
  fetch,
  store
}
