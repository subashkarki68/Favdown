import axios from "axios";
import useSWR, { SWRConfiguration } from "swr";

const HOST_URL = import.meta.env.VITE_HOST;
const fetcher = (url: string, accessToken: string) =>
  axios
    .get(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    .then((res) => res.data);

export const getSpotifyProfile = async (accessToken: string) => {
  return await fetcher(`${HOST_URL}/api/v1/users/my-spotify`, accessToken);
};

export const getSpotifyFavourites = async (accessToken: string) => {
  return await fetcher(
    `${HOST_URL}/api/v1/users/my-spotify/my-favourites`,
    accessToken
  );
};
