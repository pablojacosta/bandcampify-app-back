const bandcamp = require("bandcamp-scraper");
const express = require("express");
const cors = require("cors");
const bcfetch = require("bandcamp-fetch");

const PORT = 3001;

const app = express();
app.use(cors());

const getArtistUrl = async (params) => {
  const artistUrl = new Promise((resolve, reject) => {
    bandcamp.search(params, async function (error, searchResults) {
      if (error) {
        console.log("getArtistUrl ERROR: ", error);
      } else {
        const artistResponse = await searchResults
          .filter((result) => result.type === "artist")
          .filter((result) =>
            result.name.toLowerCase().includes(params.query.toLowerCase())
          );

        resolve(artistResponse);
      }
    });
  });
  return artistUrl;
};

const getAlbumsUrls = async (artistUrl) => {
  const albumsUrls = new Promise((resolve, reject) => {
    bandcamp.getAlbumUrls(artistUrl, async function (error, albumUrls) {
      if (error) {
        console.log("getAlbumsUrls ERROR: ", error);
      } else {
        resolve(albumUrls);
      }
    });
  });
  return albumsUrls;
};

const getOneAlbumData = async (albumUrl) => {
  const album = bcfetch.album;
  const params = {
    albumUrl,
    includeRawData: true,
  };
  return await album.getInfo(params);
};

const getAllAlbumsData = async (albumsUrls) => {
  const allAlbumsDataArray = await Promise.all(
    albumsUrls.map((album) => getOneAlbumData(album))
  );
  return allAlbumsDataArray;
};

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
    const responseArray = await getAlbumsUrls(request.query.artistUrl);
    const allAlbumsDataArray = await getAllAlbumsData(responseArray);
    response.send(allAlbumsDataArray);
  } catch (error) {
    console.log("Error :", error);
  }
});

app.listen(PORT, () => console.log(`Server Running on PORT ${PORT}`));
