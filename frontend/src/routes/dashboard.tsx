import { Link } from "react-router-dom";
import { useSession } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { SpotifyTrack } from "@/types/SpotifyTrack";
import {
  getSpotifyProfile,
  getSpotifyFavourites,
} from "../services/spotifyServices";
import { SpotifyProfileData } from "@/types/SpotifyProfileData";
import { stringify } from "querystring";

export default function DashboardPage() {
  const { session, isSignedIn } = useSession();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spotifyProfileData, setSpotifyProfileData] =
    useState<SpotifyProfileData>();
  const [spotifyFavouriteTracks, setSpotifyFavouriteTracks] = useState();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isSignedIn) {
      session.getToken().then((data) => setAccessToken(data));
    }
  }, [isSignedIn, session]);

  useEffect(() => {
    const interval = setInterval(() => {
      //TODO
      // Check if the token needs to be refreshed (assuming accessToken has an expiration time)
      if (accessToken) {
        // Implement your logic to check token expiration here
        const isTokenExpired = true; // Example logic, replace it with your actual logic

        if (isTokenExpired) {
          // If token is expired, refresh it
          session?.getToken().then((newToken) => {
            setAccessToken(newToken);
          });
        }
      }
    }, 15 * 60 * 1000); // Check every 15 minute, adjust the interval as needed
    return () => clearInterval(interval);
  }, [accessToken, session]);

  useEffect(() => {
    const fetchData = async () => {
      if (accessToken) {
        setLoading(true);
        try {
          const profile = await getSpotifyProfile(accessToken);
          const { body: favTracks } = await getSpotifyFavourites(accessToken);
          setSpotifyProfileData(profile);
          setSpotifyFavouriteTracks(favTracks);
          console.log(favTracks);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [accessToken]);

  return (
    <>
      {spotifyProfileData ? (
        <div>
          <h1>{spotifyProfileData?.display_name}</h1>
          <p>This is a protected page.</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
      <ul>
        {spotifyFavouriteTracks ? (
          spotifyFavouriteTracks?.items.map((item: SpotifyTrack) => (
            <li>{item.track.name}</li>
          ))
        ) : (
          <p>Loading Tracks...</p>
        )}
      </ul>

      <ul>
        <li>
          <Link to='/dashboard/invoices'>Invoices</Link>
        </li>
        <li>
          <Link to='/'>Return to index</Link>
        </li>
      </ul>
    </>
  );
}
