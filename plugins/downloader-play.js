import fetch from 'node-fetch';
import ytdl from 'ytdl-core';

let handler = async (m, { conn, text }) => {
    if (!text) return conn.reply(m.chat, '🎵 Ingresa un enlace de *YouTube*.', m);

    await m.react('⏳');

    const apis = [
        url => `https://api.alyachan.dev/api/ytmp3?url=${url}`, 
        url => `https://api.fgmods.xyz/api/downloader/ytmp3?url=${url}`,
        url => `https://dark-core-api.vercel.app/api/download/ytmp3?url=${url}`,
        url => `https://mahiru-shiina.vercel.app/download/ytmp3?url=${url}`,
        url => `https://api.siputzx.my.id/api/d/ytmp3?url=${url}`,
        url => `https://api.botcahx.eu.org/api/dowloader/ytmp3?url=${url}`,
        url => `https://api.agungny.my.id/api/youtube-audio?url=${url}`,
        url => `https://widipe.com/download/ytmp3?url=${url}`,
        url => `https://dlpanda.com/api?url=${url}&type=mp3`,
        url => `https://delirius-apiofc.vercel.app/download/ytmp3?url=${url}`
    ];

    let result, buffer, title = 'audio';

    for (const api of apis) {
        try {
            const response = await fetch(api(text));
            result = await response.json().catch(() => null);

            const link = result?.data?.url ||
                         result?.result?.download_url ||
                         result?.result?.url ||
                         result?.download_url ||
                         result?.link;

            title = result?.result?.title || result?.title || 'audio';

            if (link) {
                const audioRes = await fetch(link);
                if (!audioRes.ok) continue;

                buffer = await audioRes.buffer();
                break;
            }
        } catch (err) {
            console.log(`⚠️ Error con API: ${api(text)}`, err.message);
            continue;
        }
    }

    try {
        if (!buffer) {
            // fallback local con ytdl-core
            const info = await ytdl.getInfo(text);
            title = info.videoDetails.title;
            buffer = await new Promise((resolve, reject) => {
                const chunks = [];
                ytdl(text, { filter: 'audioonly', quality: 'highestaudio' })
                    .on('data', chunk => chunks.push(chunk))
                    .on('end', () => resolve(Buffer.concat(chunks)))
                    .on('error', reject);
            });
        }

        await conn.sendMessage(
            m.chat,
            {
                audio: buffer,
                mimetype: 'audio/mp4',
                fileName: `${title}.mp3`
            },
            { quoted: m }
        );

        await m.react('✅');
    } catch (err) {
        console.error(err);
        await m.react('💢');
        m.reply('❌ No se pudo descargar el audio.');
    }
};

handler.command = /^(play|ytmp3)$/i;
handler.tags = ['descargas'];
export default handler;
