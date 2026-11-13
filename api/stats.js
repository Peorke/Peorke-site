const HANDLE = process.env.YT_HANDLE || "peorke";
const INVITE = process.env.DISCORD_INVITE || "V8D5sRbgxU";

module.exports = async (req, res) => {
  const out = { subscribers: null, views: null, videos: null, discord: null, online: null };
  const key = process.env.YOUTUBE_API_KEY;

  await Promise.all([
    (async () => {
      if (!key) return;
      try {
        const r = await fetch("https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=" +
          encodeURIComponent(HANDLE) + "&key=" + key);
        const j = await r.json();
        const s = j.items && j.items[0] && j.items[0].statistics;
        if (s) { out.subscribers = Number(s.subscriberCount); out.views = Number(s.viewCount); out.videos = Number(s.videoCount); }
      } catch (e) {}
    })(),
    (async () => {
      try {
        const r = await fetch("https://discord.com/api/v10/invites/" + INVITE + "?with_counts=true");
        const j = await r.json();
        out.discord = j.approximate_member_count || null;
        out.online = j.approximate_presence_count || null;
      } catch (e) {}
    })(),
  ]);

  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
  res.status(200).json(out);
};
