const axios = require('axios').default;
const cheerio = require('cheerio');
const { Telegraf } = require('telegraf');
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {};
const { Pool } = require('pg');
require ('dotenv').config();

const {
  POSTGRES_HOST,
  POSTGRES_DB,
  POSTGRES_USER,
  POSTGRES_PASSWORD
  } = process.env

const myEmitter = new MyEmitter();
myEmitter.setMaxListeners(0);

const pool = new Pool({
  host: 'localhost',
  database: 'hey_lyrics_now',
  username: 'diegote',
  password: 'diegote'
});

// Conexión con Telegram
const token = '6095592859:AAG7ImwPScy04HbRgD0ZJaPSTpPIjkuLvYA';
const bot = new Telegraf(token, {polling: true});
// Conexión con Musixmatch
const url = 'https://api.musixmatch.com/ws/1.1';
const musixmatch = '3d9beec34f130fe7f8967bcec2286f67';

let artist = '';
let song = '';

// Comando start
bot.start((ctx) => {
  const username = (ctx.update.message.from.first_name);
  const user_id = (ctx.update.message.from.id);
  const lang = (ctx.update.message.from.language_code);
  
  const insertUser = async () => {
    try{
      const query_username = [username]
      const values = [user_id, username];
      const select = "SELECT username FROM users WHERE username=($1)";
      const res = await pool.query(select, query_username);
      if (res.rowCount == 0) {
        const insert = "INSERT INTO users(user_id, username) VALUES ($1, $2)";
        insert_res = await pool.query(insert, values);
        console.log(insert_res);
      }
    } catch(err) {
      console.log(err);
    }
  };
  insertUser();
  
  if (lang == 'es') {
    ctx.reply(`¡Hola ${username}! Soy Hey! Lyrics Now!. Puedo darte las letras de cualquier canción que desees. Sólo escribe /help y te diré como usarme.`)
  } else {
    ctx.reply(`Hi ${username}! I'm Hey! Lyrics Now! I can send you the lyrics of any song you want. Just type /help and I'll tell you how to use me.`)
  }
  
});

// Comando help
bot.help((ctx) => {
  help_lang = (ctx.update.message.from.language_code);
  if (help_lang == 'es') {
    ctx.reply("Para usarme, empieza escribiendo /artist seguido del nombre del artista. Cuando hayas elegido al artista, escribe /song seguido del nombre de la canción de la cuál desees la letra. Si quieres buscar otra canción del mismo artista, de nuevo escribe /song seguido del nombre de la canción. Si quieres buscar otro artista, vuelve a escribir /artist seguido del nombre del artista.")
  } else {
    ctx.reply("To use me, start typing /artist followed by the name of the artist. Once you've choosen the artist, type /song followed by the name of the song you want the lyrics of. If you want to search for another song of the same artist, type /song followed by the name of the song. If you want to search for another artist, type /artist followed by the name of the artist.")
  }
});

// Comando artist
bot.command('artist', (ctx) => {
  artist_lang = (ctx.update.message.from.language_code);
  artist = ctx.update.message.text.split(' ').slice(1).toString().replace(/,/g, ' ');
  if (artist === ''){
    if (artist_lang == 'es') {
      ctx.reply('¡Dime el nombre del artista!');
    } else {
      ctx.reply('Tell me the name of the artist!');
    }
  } else {
    axios.get(`${url}/artist.search?q_artist=${artist}&apikey=${musixmatch}`)
      .then((response) => {
        const artistList = response.data.message.body.artist_list;
        if (artistList.length === 0) {
          if (artist_lang == 'es') {
            ctx.reply(`Lo siento, no pude encontrar al artista ${artist}. Prueba de nuevo con otro o revisa algún posible error de escritura`);
          } else {
            ctx.reply(`Sorry, I couldn't find the artist ${artist}. Try again with another one or check for possible spelling mistake.`);  
          }
          return;
        } else {
          artist = artist.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
          if (artist_lang == 'es') {
            ctx.reply(`Tu artista es ${artist}.\n\nAhora dame el comando /song más el nombre de la canción de ${artist} que quieres las letras. O, si quieres buscar otro artista, escribe /artist seguido del nombre del artista.`);
          } else {
            ctx.reply(`Your artist is ${artist}.\n\nNow give me the /song command and the name of the song of ${artist} you want the lyrics of. Or, if you want to search for another artist, type /artist followed by the name of the artist`);
          }
          const insertArtist = async () => {
            try{
              const query_artist = [artist]
              const select = "SELECT artist FROM artists WHERE artist=($1)";
              const res = await pool.query(select, query_artist);
              if (res.rowCount == 0) {
                const insert = "INSERT INTO artists(artist) VALUES ($1)"
                insert_res = await pool.query(insert, query_artist);
              }
            } catch(err) {
              console.log(err);
            }
          };
          insertArtist();
        }
      })
  .catch((error) => {
    console.error(error);
  });
  }
});

// Comando song
bot.command('song', ctx => {
  song_lang = (ctx.update.message.from.language_code);
  song = ctx.update.message.text.split(' ').slice(1).toString().replace(/,/g, ' ');
  if (artist === '') {
    if (song_lang == 'es') {
      ctx.reply('¡Primero dime el nombre del artista!');
    } else {
      ctx.reply('Tell me the name of the artist first!');
    }
    return;
  }
  if (song === '') {
    if (song_lang == 'es') {
      ctx.reply('¡Dime el nombre de la canción!');
    } else {
      ctx.reply('Tell me the name of the song!');
    }
    return;
  } else {
    song = song.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
    axios.get(`https://www.musixmatch.com/lyrics/${artist.replace(/\-/g,'').replace(/\s/g,'-').replace(/,/g, '')}/${song.replace(/\-/g,'').replace(/,/g, '').replace(/[\s]+/g,'-')}`, {maxRedirects: 1000})
    .then(function(response) {
      const $ = cheerio.load(response.data);
      const lyric = $('.r-ueyrd6').text().replace(/([a-z]|['",\?\!\)]|[0-9])([A-Z]|[\(\¡\¿])/g, '$1\n$2').replace(/(")(\s)([a-z]+|[0-9]+)("\n)([A-Z])/g, '$2$3"\n$5');
      if (song_lang == 'es') {
        ctx.reply(`OK, aquí tienes la letra de "${song}" por ${artist}\n\n********\n\n${lyric}\n\n********\n\nSi deseas buscar otra canción de este artista, escribe /song seguido de su nombre. O, si quieres buscar otro artista, escribe /artist seguido del nombre del artisa.`);
      } else {
        ctx.reply(`OK, here are the lyrics of "${song}" by ${artist}\n\n********\n\n${lyric}\n\n********\n\nIf you want to search for another song of this artist, type /song followed by its name. Or, if you want to search for another artist, type /artist followed by the name of the artist`);
      }

      var insertSong = async () => {
        try{
          const select_artist_id = "SELECT artist_id FROM artists WHERE artist=($1)";
          const artist_id = await pool.query(select_artist_id, [artist]);
          const values = [song, artist_id.rows[0].artist_id];
          const select = "SELECT song, artist_id FROM songs WHERE song=($1) AND artist_id=($2)";
          const res = await pool.query(select, values);
          if (res.rowCount == 0) {
            const insert = "INSERT INTO songs(song, artist_id) VALUES ($1, $2)";
            insert_res = await pool.query(insert, values);
          }
        } catch(err) {
          console.log(err);
        }
      };

      var insertRequest = async () => {
        try {
          const user_id = (ctx.update.message.from.id);
          const select_artist_id = "SELECT artist_id FROM artists WHERE artist=($1)";
          const res_artist_id = await pool.query(select_artist_id, [artist]);
          const artist_id = res_artist_id.rows[0].artist_id;
          const select_song_id = "SELECT song_id FROM songs WHERE song=($1) AND artist_id=($2)";
          const query_song = [song, artist_id];
          var res_song_id = await pool.query(select_song_id, query_song);
          if (res_song_id.rowCount == 0) {
            insertSong();
            res_song_id = await pool.query(select_song_id, query_song);
          }
          const song_id = res_song_id.rows[0].song_id;
          const values = [user_id, artist_id, song_id];
          const insert = "INSERT INTO requests(user_id, artist_id, song_id) VALUES ($1, $2, $3)";
          insert_res = await pool.query(insert, values);
        } catch(err) {
          console.log(err);
        }
      };
      insertRequest();

    })
    .catch((error) => {
      if (song_lang == 'es') {
        ctx.reply("Lo siento, no pude encontrar la letra de esa canción. Prueba de nuevo con otra o revisa algún posible error de escritura");
      } else {
        ctx.reply("Sorry, I couldn't find the lyrics of that song. Try again with another one or check for possible spelling mistake.");
      }
    });
  }
});

bot.on('text', (ctx) => {
  err_lang = (ctx.update.message.from.language_code);
  if (err_lang == 'es') {
    ctx.reply(`Lo siento, pero no te entiendo. Escribe /help para ver cómo usarme.`);
  } else {
    ctx.reply(`Sorry, but I don't understand you. Type /help to see how to use me.`);
  }
});

bot.launch();