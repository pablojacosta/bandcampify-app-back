const bandcamp = require("bandcamp-scraper");
const express = require("express");
const cors = require("cors");
const bcfetch = require("bandcamp-fetch");

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

const localeIncludes = (
  string,
  searchString,
  { position = 0, locales, ...options } = {}
) => {
  if (
    string === undefined ||
    string === null ||
    searchString === undefined ||
    searchString === null
  ) {
    throw new Error("localeIncludes requires at least 2 parameters");
  }

  const stringLength = string.length;
  const searchStringLength = searchString.length;
  const lengthDiff = stringLength - searchStringLength;

  for (let i = position; i <= lengthDiff; i++) {
    if (
      string
        .substring(i, i + searchStringLength)
        .localeCompare(searchString, locales, options) === 0
    ) {
      return true;
    }
  }

  return false;
};

const getArtistUrl = async (params) => {
  const artistUrl = new Promise((resolve, reject) => {
    bandcamp.search(params, async function (error, searchResults) {
      if (error) {
        console.log("getArtistUrl ERROR: ", error);
      } else {
        const artistResponse = searchResults.filter((result) =>
          localeIncludes(result.name, params.query, {
            usage: "search",
            sensitivity: "base",
          })
        );

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

  response.send(responseArray);
});

app.get("/albums", async (request, response) => {
  try {
    const artistInfo = await getArtistInfo(request.query.artistUrl);
    response.send(artistInfo);
  } catch (error) {
    console.log("Error :", error);
  }
});

app.get("/album", async (request, response) => {
  try {
    const albumInfo = await getOneAlbumData(request.query.albumUrl);
    response.send(albumInfo);
  } catch (error) {
    console.log("Error :", error);
  }
});

app.get("/track", async (request, response) => {
  try {
    const trackInfo = await getTrackData(request.query.trackUrl);
    response.send(trackInfo);
  } catch (error) {
    console.log("Error :", error);
  }
});

app.listen(PORT, () => console.log(`Server Running on PORT ${PORT}`));
