CREATE DATABASE hey_lyrics_now;

CREATE TABLE users(
    user_id INT UNIQUE,
    username VARCHAR(30)
);

CREATE TABLE artists(
    artist_id SERIAL UNIQUE,
    artist VARCHAR(30)
);

CREATE TABLE songs(
    song_id SERIAL UNIQUE,
    song VARCHAR(30),
    artist_id INT
);

ALTER TABLE songs
ADD CONSTRAINT song_artist_id_fk FOREIGN KEY (artist_id)
REFERENCES artists(artist_id);

CREATE TABLE requests(
    request_id SERIAL UNIQUE,
    user_id INT,
    artist_id INT,
    song_id INT
);

ALTER TABLE requests
ADD CONSTRAINT request_user_id_fk FOREIGN KEY (user_id)
REFERENCES users(user_id);

ALTER TABLE requests
ADD CONSTRAINT request_artist_id_fk FOREIGN KEY (artist_id)
REFERENCES artists(artist_id);

ALTER TABLE requests
ADD CONSTRAINT request_song_id_fk FOREIGN KEY (song_id)
REFERENCES songs(song_id);
