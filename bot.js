const axios = require('axios').default;
const cheerio = require('cheerio');
const { Telegraf } = require('telegraf');

// Conexión con Telegram
const token = '6095592859:AAG7ImwPScy04HbRgD0ZJaPSTpPIjkuLvYA';
const bot = new Telegraf(token, {polling: true});
// Conexión con Musixmatch
const url = 'https://api.musixmatch.com/ws/1.1';
const musixmatch = '3d9beec34f130fe7f8967bcec2286f67';

let artist = '';
let song = '';

bot.start((ctx) => {
  const username = (ctx.update.message.from.first_name);
  ctx.reply(`Hi ${username}! I'm Hey Lyrics Now! I can send you the lyrics of any song you want. Just type /help and I'll tell you how to use me.`)
});

bot.help((ctx) => {
  ctx.reply("To use me, start typing /artist followed by the name of the artist. Once you've choosen the artist, type /song followed by the name of the song you want the lyrics of. If you want to search for another song of the same artist, type /song followed by the name of the song. If you want to search for another artist, type /artist followed by the name of the artist.")
});

bot.command('artist', (ctx) => {
  artist = ctx.update.message.text.split(' ').slice(1).toString().replace(/,/g, ' ');
  if (artist === ''){
    ctx.reply('Tell me the name of the artist!');
  } else {
    axios.get(`${url}/artist.search?q_artist=${artist}&apikey=${musixmatch}`)
      .then((response) => {
        const artistList = response.data.message.body.artist_list;
        if (artistList.length === 0) {
          ctx.reply(`Sorry, I couldn't find the artist ${artist}. Try again with another one or check for possible spelling mistake.`);
          return;
        } else {
          ctx.reply(`Your artist is ${artist}.\n\nNow give me the /song command and the name of the song of ${artist} you want the lyrics of. Or, if you want to search for another artist, type /artist followed by the name of the artist`);
        }
      })
  .catch((error) => {
    console.error(error);
  });
  }
});

bot.command('song', ctx => {
  song = ctx.update.message.text.split(' ').slice(1).toString().replace(/,/g, ' ');
  if (artist === '') {
    ctx.reply('Tell me the name of the artist first!');
    return;
  }
  if (song === '') {
    ctx.reply('Tell me the name of the song!');
    return;
  } else {
    axios.get(`https://www.musixmatch.com/es/letras/${artist.replace(/\s/g, "-")}/${song.replace(/\s/g, "-")}`)
    .then(function(response) {
      const html = response.data;
      const $ = cheerio.load(html);
      const lyric = $('.mxm-lyrics__content ').text();
      if (lyric === '') {
        ctx.reply("Sorry, it seems we don't have these lyrics. Try again with another /song command or try with another /artist.")
        return;
      } else {
        ctx.reply(`OK, here are the lyrics of "${song}" by ${artist}\n\n********\n\n${lyric}\n\n********\n\nIf you want to search for another song of this artist, type /song followed by its name. Or, if you want to search for another artist, type /artist followed by the name of the artist`);
      }
    })
    .catch((error) => {
      ctx.reply("Sorry, I couldn't find the lyrics of that song. Try again with another one or check for possible spelling mistake.")
      console.log(error);
    });
  }
});

bot.on('text', (ctx) => {
  ctx.reply(`Sorry, but I don't understand you. Type /help to see how to use me.`);
});

bot.launch();