const bandcamp = require("bandcamp-scraper");
const express = require("express");
const cors = require("cors");

const PORT = 3001;

const app = express();
app.use(cors());

const getArtistUrl = async (params) => {
  let artistUrl = new Promise((resolve, reject) => {
    bandcamp.search(params, async function (error, searchResults) {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        const artistUrl = await searchResults
          .filter((result) => result.type === "artist")
          .filter((result) =>
            result.name.toLowerCase().includes(params.query.toLowerCase())
          );

        resolve(artistUrl);
      }
    });
  });
  return await artistUrl;
};

const getAlbumsUrls = async (artistUrl) => {
  let albumsUrls = new Promise((resolve, reject) => {
    const albumsUrls = bandcamp.getAlbumUrls(
      artistUrl,
      async function (error, albumUrls) {
        if (error) {
          console.log("ERROR: ", error);
        } else {
          resolve(albumUrls);
        }
      }
    );
  });
  return await albumsUrls;
};

const getOneAlbumData = async (album) => {
  const albumData = new Promise((resolve, reject) => {
    bandcamp.getAlbumProducts(album, async function (error, albumProducts) {
      if (error) {
        console.log("ERROR IN getOneAlbumData", error);
      } else {
        const albumAllInfo = await new Promise((resolve, reject) => {
          bandcamp.getAlbumInfo(album, function (error, albumInfo) {
            if (error) {
              console.log("ERROR IN ALBUM ID AND ARTIST", error);
            } else {
              resolve({
                id: albumInfo.raw.current.id,
                artist: albumInfo.artist,
                name: albumInfo.title,
                image: albumInfo.imageUrl,
                tracks: albumInfo.tracks,
              });
            }
          });
        });
        const albumData = {
          name: await albumAllInfo.name,
          url: album,
          image: await albumAllInfo.image,
          id: await albumAllInfo.id,
          artist: await albumAllInfo.artist,
          tracks: await albumAllInfo.tracks,
        };
        resolve(albumData);
      }
    });
  });
  console.log("ONE ALBUM DATA", await albumData);
  return await albumData;
};

const getAllAlbumsData = async (albumsUrls) => {
  const allAlbumsDataArray = await Promise.all(
    albumsUrls.map((album) => getOneAlbumData(album))
  );
  console.log("allAlbumsDataArray", allAlbumsDataArray);
  return allAlbumsDataArray;
};

const getAllAlbumsDataArray = async (params) => {
  const artistUrl = await getArtistUrl(params);

  if (artistUrl === undefined) {
    return;
  }

  const albumsUrls = await getAlbumsUrls(artistUrl);
  const allAlbumsDataArray = await getAllAlbumsData(albumsUrls);

  return allAlbumsDataArray;
};

app.get("/", async (request, response) => {
  response.send("hello");
});

app.get("/artist", async (request, response) => {
  const params = {
    query: request.query.artist,
    page: 1,
  };

  const responseArray = await getArtistUrl(params);

  if (responseArray === undefined) {
    response.send("Artist/Band not found. Please try again");
  }

  response.send(responseArray);
});

app.get("/albums", async (request, response) => {
  response.send("albums");
  console.log("query", request.query);

  try {
    const responseArray = await getAlbumsUrls(request.query.artistUrl);
    response.send(responseArray);
  } catch (error) {
    console.log("Error: ", error);
  }
});

app.listen(PORT, () => console.log(`Server Running on PORT ${PORT}`));
