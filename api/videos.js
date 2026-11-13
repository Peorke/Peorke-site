const HANDLE = process.env.YT_HANDLE || "peorke";
let channelId = process.env.CHANNEL_ID || "UC8-8dHK9UkMntfvijhNxQRQ";

const feed = (id) => "https://www.youtube.com/feeds/videos.xml?channel_id=" + id;
function decode(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}
function pick(src, re) { const m = src.match(re); return m ? m[1] : ""; }

function parse(xml, limit) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, limit).map((m) => ({
    id: pick(m[1], /<yt:videoId>(.*?)<\/yt:videoId>/),
    title: decode(pick(m[1], /<title>([\s\S]*?)<\/title>/)),
    published: pick(m[1], /<published>(.*?)<\/published>/),
    views: Number(pick(m[1], /<media:statistics views="(\d+)"/)) || 0,
  })).filter((v) => v.id);
}

async function resolveId() {
  const r = await fetch("https://www.youtube.com/@" + HANDLE, { headers: { "accept-language": "en" } });
  const t = await r.text();
  const m = t.match(/"channelId":"(UC[\w-]{22})"/) || t.match(/channel_id=(UC[\w-]{22})/);
  return m ? m[1] : null;
}

module.exports = async (req, res) => {
  try {
    let r = await fetch(feed(channelId));
    if (!r.ok) {
      const id = await resolveId();
      if (!id) return res.status(502).json({ error: "channel_not_found" });
      channelId = id;
      r = await fetch(feed(channelId));
      if (!r.ok) return res.status(502).json({ error: "feed_unavailable" });
    }
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json(parse(await r.text(), 7));
  } catch (e) {
    res.status(502).json({ error: "feed_error" });
  }
};
module.exports.parse = parse;
