import axios from "axios";

const fetcher = (url: string, accessToken: string) =>
  axios
    .get(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    .then((res) => res.data);

export const getSpotifyProfile = async (accessToken: string) => {
  return await fetcher(
    `http://localhost:2700/api/v1/users/my-spotify`,
    accessToken
  );
};

export const getSpotifyFavourites = async (accessToken: string) => {
  return await fetcher(
    `http://localhost:2700/api/v1/users/my-spotify/my-favourites`,
    accessToken
  );
};
