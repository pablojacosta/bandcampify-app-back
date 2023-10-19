const bandcamp = require("bandcamp-scraper");
const express = require("express");
const cors = require("cors");
const bcfetch = require("bandcamp-fetch");

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

const getArtistUrl = async (params) => {
  const artistUrl = new Promise((resolve, reject) => {
    bandcamp.search(params, async function (error, searchResults) {
      if (error) {
        console.log("getArtistUrl ERROR: ", error);
      } else {
        const artistResponse = searchResults
          .filter((result) => result.type === "artist")
          .filter((result) => result.name.localeCompare(params.query));

        resolve(artistResponse);
      }
    });
  });
  return artistUrl;
};

const getArtistInfo = async (artistUrl) => {
  const artistInfo = new Promise((resolve, reject) => {
    bandcamp.getArtistInfo(artistUrl, function (error, artistInfo) {
      if (error) {
        console.log("getArtistInfo ERROR: ", error);
      } else {
        resolve(artistInfo);
      }
    });
  });
  return artistInfo;
};

const getOneAlbumData = async (albumUrl) => {
  const album = bcfetch.album;
  const params = {
    albumUrl,
    includeRawData: true,
  };
  return await album.getInfo(params);
};

const getTrackData = async (trackUrl) => {
  const track = bcfetch.track;
  const params = {
    trackUrl,
  };
  return await track.getInfo(params);
};

app.get("/", async (request, response) => {
  response.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
  response.send("Hi! This is Bandcampify's backend. :)");
});

app.get("/artist", async (request, response) => {
  const params = {
    query: request.query.artist,
    page: 1,
  };

  const responseArray = await getArtistUrl(params);

  if (responseArray.length === 0) {
    response.send("Artist/Band not found. Please try again.");
    return;
  }

  response.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
  response.send(responseArray);
});

app.get("/albums", async (request, response) => {
  try {
    const artistInfo = await getArtistInfo(request.query.artistUrl);

    response.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
    response.send(artistInfo);
  } catch (error) {
    console.log("Error :", error);
  }
});

app.get("/album", async (request, response) => {
  try {
    const albumInfo = await getOneAlbumData(request.query.albumUrl);

    response.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
    response.send(albumInfo);
  } catch (error) {
    console.log("Error :", error);
  }
});

app.get("/track", async (request, response) => {
  try {
    const trackInfo = await getTrackData(request.query.trackUrl);

    response.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
    response.send(trackInfo);
  } catch (error) {
    console.log("Error :", error);
  }
});

app.listen(PORT, () => console.log(`Server Running on PORT ${PORT}`));

module.exports = app;
