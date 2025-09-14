// plugins/downloader-play.js
import fetch from "node-fetch";
import ytdl from "ytdl-core";
import fs from "fs";
import path from "path";

const __dirname = process.cwd();

const backups = [
  url => `https://api.akuari.my.id/downloader/youtube?link=${encodeURIComponent(url)}`,
  url => `https://api.ryzendesu.vip/downloader/ytmp3?url=${encodeURIComponent(url)}`,
  url => `https://api.giftedtechnexus.co/download/ytmp3?url=${encodeURIComponent(url)}`,
  url => `https://widipe.com/download/ytmp4?url=${encodeURIComponent(url)}`,
  url => `https://dlpanda.com/api?url=${encodeURIComponent(url)}&type=mp3`
];

async function ytdlDownload(url) {
  if (!ytdl.validateURL(url)) throw new Error("❌ URL inválida de YouTube");

  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
  const file = path.join(__dirname, `tmp/${Date.now()}.mp3`);

  await new Promise((resolve, reject) => {
    const stream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25 // evita "premature close"
    }).pipe(fs.createWriteStream(file));

    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return { file, title };
}

async function apiDownload(url) {
  for (let api of backups) {
    try {
      const res = await fetch(api(url));
      if (!res.ok) throw new Error(`API ${api} no respondió`);

      const data = await res.json().catch(() => null);
      if (!data) continue;

      // intenta detectar la URL de descarga
      const dlUrl =
        data.result?.url ||
        data.result?.download_url ||
        data.result?.link ||
        data.download?.link ||
        null;

      if (dlUrl) return { dlUrl, title: data.result?.title || "audio" };
    } catch (e) {
      console.log("⚠️ Error con API:", api(url), e.message);
      continue;
    }
  }
  throw new Error("❌ Todas las APIs externas fallaron.");
}

let handler = async (m, { text, conn }) => {
  if (!text) return m.reply("🔎 Ingresa el enlace o nombre de una canción.");

  let url = text.includes("youtube.com") || text.includes("youtu.be") ? text : null;

  try {
    let result;
    if (url) {
      // 1️⃣ Intento con ytdl-core
      try {
        result = await ytdlDownload(url);
        await conn.sendMessage(m.chat, {
          audio: { url: result.file },
          mimetype: "audio/mp4",
          fileName: `${result.title}.mp3`
        }, { quoted: m });
        fs.unlinkSync(result.file);
        return;
      } catch (err) {
        console.log("⚠️ Error ytdl-core:", err.message);
      }

      // 2️⃣ Intento con APIs externas
      result = await apiDownload(url);
      if (result?.dlUrl) {
        await conn.sendMessage(m.chat, {
          audio: { url: result.dlUrl },
          mimetype: "audio/mp4",
          fileName: `${result.title}.mp3`
        }, { quoted: m });
        return;
      }
    } else {
      m.reply("❌ Solo soporta enlaces de YouTube por ahora.");
    }
  } catch (e) {
    console.log(e);
    m.reply("❌ No pude descargar el audio. Intenta con otro link.");
  }
};

handler.help = ["play", "ytmp3"];
handler.tags = ["downloader"];
handler.command = /^(play|yt(mp3)?)$/i;

export default handler;
