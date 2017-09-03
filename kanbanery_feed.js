const request = require("request-promise-native")
const cheerio = require("cheerio")

let _cache = []
const cache = (feed = []) => {
  _cache = [..._cache, ...feed]

  // clear cache from previous days
  _cache = _cache.filter(c => c.date === new Date().toDateString())
}

const onlyNewFeed = (feed = []) => {
  return feed.map(f => {
    const in_cache = _cache.some(c => c.title === f.title && c.time === f.time && c.description === f.description)

    if (in_cache) return false
    return f
  }).filter(f => f && f.date === new Date().toDateString())
}

const fetch = async (url) => {
  const req = await request(url)
  const $ = cheerio.load(req)
  const feed = $("#project-history > dd.loaded")
  const json_feed = onlyNewFeed(feed2json($, feed))
  console.log("New feed: ")
  console.log(json_feed)
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
      date: new Date().toDateString()
    }
  }).get()
}

module.exports = {
  fetch
}
