import fetch from "node-fetch";
import ytdl from "ytdl-core";
import yts from "yt-search";

const prefix = "!"; // 🔹 Define aquí tu prefijo fijo

// 🔹 Lista de 20 APIs externas de descarga
const downloadAPIs = [
  (url) => `https://api.davidcyriltech.my.id/download/ytmp3?url=${url}`,
  (url) => `https://api.ryzendesu.vip/api/dl/ytmp3?url=${url}`,
  (url) => `https://api.fgmods.xyz/api/downloader/ytmp3?url=${url}`,
  (url) => `https://api.nyxs.pw/dl/ytmp3?url=${url}`,
  (url) => `https://api-caliph.vercel.app/api/ytmp3?url=${url}`,
  (url) => `https://api.vreden.my.id/api/ytmp3?url=${url}`,
  (url) => `https://api.agatz.xyz/api/ytmp3?url=${url}`,
  (url) => `https://api.akuari.my.id/downloader/ytmp3?url=${url}`,
  (url) => `https://api.lolhuman.xyz/api/ytmp3?url=${url}`,
  (url) => `https://delirius-apiofc.vercel.app/download/ytmp3?url=${url}`,
  (url) => `https://api.zahwazein.xyz/downloader/ytmp3?url=${url}`,
  (url) => `https://widipe.com/download/ytmp3?url=${url}`,
  (url) => `https://vihangayt.me/download/ytmp3?url=${url}`,
  (url) => `https://api.fgmods.xyz/api/ytmp3?url=${url}`,
  (url) => `https://api.xteam.xyz/dl/ytmp3?url=${url}`,
  (url) => `https://api.erdwpe.xyz/api/ytmp3?url=${url}`,
  (url) => `https://api.neoxr.eu/api/ytmp3?url=${url}`,
  (url) => `https://api.botcahx.biz.id/api/ytmp3?url=${url}`,
  (url) => `https://api.tiodevhost.my.id/api/youtube/playmp3?url=${url}`,
  (url) => `https://api.vihangayt.me/api/ytmp3?url=${url}`
];

const handler = async (m, { conn, args }) => {
  if (!args[0]) {
    return conn.reply(
      m.chat,
      `✏️ Ingresa un título para buscar en YouTube.\n\nEjemplo:\n> ${prefix}play Corazón Serrano - Mix`,
      m
    );
  }

  try {
    // 1️⃣ Buscar en YouTube
    const search = await yts(args.join(" "));
    if (!search.videos || !search.videos.length)
      return conn.reply(m.chat, "❌ No se encontraron resultados.", m);

    const video = search.videos[0];
    const videoInfo = {
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail,
      timestamp: video.timestamp,
      ago: video.ago,
      views: video.views
    };

    // 2️⃣ Enviar info del video
    const thumb = await (await fetch(videoInfo.thumbnail)).buffer();
    await conn.sendMessage(
      m.chat,
      {
        image: thumb,
        caption: `🎶 *Resultado encontrado*\n\n📌 *Título:* ${videoInfo.title}\n⏱️ *Duración:* ${videoInfo.timestamp}\n👀 *Vistas:* ${videoInfo.views}\n📅 *Publicado:* ${videoInfo.ago}\n🔗 *Enlace:* ${videoInfo.url}`
      },
      { quoted: m }
    );

    // 3️⃣ Intentar descarga con las 20 APIs
    const encodedUrl = encodeURIComponent(videoInfo.url);
    let audioBuffer = null;

    for (const api of downloadAPIs) {
      try {
        const res = await fetch(api(encodedUrl));
        if (!res.ok) continue;

        const json = await res.json();

        const dlUrl =
          json.result?.download_url ||
          json.result?.url ||
          json.result?.audio ||
          json.url;

        if (dlUrl) {
          audioBuffer = await (await fetch(dlUrl)).buffer();
          break;
        }
      } catch (e) {
        console.log("⚠️ Error con API:", api(encodedUrl), e.message);
      }
    }

    // 4️⃣ Último recurso: YTDL local
    if (!audioBuffer) {
      const audioStream = ytdl(videoInfo.url, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25
      });

      await conn.sendMessage(
        m.chat,
        {
          audio: { stream: audioStream },
          mimetype: "audio/mpeg",
          fileName: `${videoInfo.title}.mp3`
        },
        { quoted: m }
      );
      return;
    }

    // 5️⃣ Enviar el audio
    await conn.sendMessage(
      m.chat,
      {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        fileName: `${videoInfo.title}.mp3`
      },
      { quoted: m }
    );
  } catch (e) {
    console.error(e);
    conn.reply(m.chat, "❗ Error al procesar tu solicitud.", m);
  }
};

handler.help = ["play"];
handler.tags = ["descargas"];
handler.command = ["play"];

export default handler;
