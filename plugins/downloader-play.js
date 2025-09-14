import axios from "axios";
import yts from "yt-search";
import ytdl from "ytdl-core";
import fs from "fs";
import path from "path";
import config from "../config.cjs";

const play = async (m, gss) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";
  const args = m.body.slice(prefix.length + cmd.length).trim().split(" ");

  if (cmd === "play") {
    if (args.length === 0 || !args.join(" ")) {
      return m.reply("*Please provide a song name or keywords to search for.*");
    }

    const searchQuery = args.join(" ");
    m.reply("> *🎧 Searching for the song...*");

    try {
      const searchResults = await yts(searchQuery);
      if (!searchResults.videos || searchResults.videos.length === 0) {
        return m.reply(`❌ No results found for "${searchQuery}".`);
      }

      const firstResult = searchResults.videos[0];
      const videoUrl = firstResult.url;

      // Lista de métodos de descarga (20 en total)
      const methods = [
        { type: "ytdl", url: videoUrl },
        { type: "api", url: `https://api.davidcyriltech.my.id/download/ytmp3?url=${videoUrl}` },
        { type: "api", url: `https://api.lolhuman.xyz/api/ytaudio2?url=${videoUrl}` },
        { type: "api", url: `https://vihangayt.me/download/ytmp3?url=${videoUrl}` },
        { type: "api", url: `https://api.hxz-api.xyz/dl/ytmp3?url=${videoUrl}` },
        { type: "api", url: `https://api.neoxr.eu.org/api/download/youtube?url=${videoUrl}` },
        { type: "api", url: `https://api.itsrose.life/youtube-mp3?url=${videoUrl}` },
        { type: "api", url: `https://api.bochilteam.com/download/ytmp3?url=${videoUrl}` },
        { type: "api", url: `https://api.shadowapi.xyz/api/yta?url=${videoUrl}` },
        { type: "api", url: `https://api.violetics.pw/api/media/youtube?url=${videoUrl}` },
        { type: "api", url: `https://api.zenzapi.xyz/downloader/ytmp3?url=${videoUrl}` },
        { type: "api", url: `https://api.lordkeb.com/ytmp3?url=${videoUrl}` },
        { type: "api", url: `https://api.agatz.xyz/api/ytmp3?url=${videoUrl}` },
        { type: "api", url: `https://api.alphacoders.xyz/api/ytaudio?url=${videoUrl}` },
        { type: "api", url: `https://api.xyroinee.xyz/api/ytmp3?url=${videoUrl}` },
        { type: "api", url: `https://api.caliphapi.com/ytaudio?url=${videoUrl}` },
        { type: "api", url: `https://api.nurutomo.xyz/api/ytaudio?url=${videoUrl}` },
        { type: "api", url: `https://api.kenapanani.xyz/api/ytdl?url=${videoUrl}` },
        { type: "api", url: `https://api.akuari.my.id/downloader/ytmp3?url=${videoUrl}` },
        { type: "api", url: `https://guruapi.tech/api/ytaudio?url=${videoUrl}` },
      ];

      let downloaded = false;

      for (let method of methods) {
        try {
          let title, downloadUrl;

          if (method.type === "ytdl") {
            // Método local con ytdl-core
            title = firstResult.title;
            const outputPath = path.resolve(`./tmp/${Date.now()}.mp3`);
            await new Promise((resolve, reject) => {
              ytdl(method.url, { filter: "audioonly", quality: "highestaudio" })
                .pipe(fs.createWriteStream(outputPath))
                .on("finish", resolve)
                .on("error", reject);
            });
            await gss.sendMessage(
              m.from,
              {
                audio: { url: outputPath },
                mimetype: "audio/mp4",
                ptt: false,
              },
              { quoted: m }
            );
            fs.unlinkSync(outputPath);
            m.reply(`> ✅ *${title}* downloaded successfully!`);
            downloaded = true;
            break;
          } else {
            // Método externo por API
            const res = await axios.get(method.url);
            const data = res.data;

            // Diferentes APIs usan estructuras distintas
            if (data.result?.download_url) {
              title = data.result.title || firstResult.title;
              downloadUrl = data.result.download_url;
            } else if (data.result?.url) {
              title = data.result.title || firstResult.title;
              downloadUrl = data.result.url;
            } else if (data.url) {
              title = data.title || firstResult.title;
              downloadUrl = data.url;
            }

            if (!downloadUrl) throw new Error("Invalid API response");

            await gss.sendMessage(
              m.from,
              {
                audio: { url: downloadUrl },
                mimetype: "audio/mp4",
                ptt: false,
              },
              { quoted: m }
            );
            m.reply(`> ✅ *${title}* downloaded successfully!`);
            downloaded = true;
            break;
          }
        } catch (err) {
          console.log(`⚠️ Método fallido: ${method.url}`);
          continue; // Probar siguiente método
        }
      }

      if (!downloaded) {
        m.reply("❌ All download methods failed, please try again later.");
      }
    } catch (error) {
      console.error(error);
      m.reply("❌ An error occurred while processing your request.");
    }
  }
};

export default play;
