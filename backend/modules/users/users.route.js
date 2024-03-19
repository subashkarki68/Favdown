//backend -> modules -> user -> user.route.js
const router = require('express').Router();
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

router.get('/my-spotify', async (req, res) => {
    try {
        // console.log(req.spotifyToken);
        spotifyApi.setAccessToken(req.spotifyToken);
        const { body } = await spotifyApi.getMe();
        res.json(body);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Something went wrong!' });
    }
});

router.get('/my-spotify/my-favourites', async (req, res) => {
    try {
        spotifyApi.setAccessToken(req.spotifyToken);
        // Get tracks in the signed in user's Your Music library
        spotifyApi
            .getMySavedTracks({
                limit: 20,
                offset: 1,
            })
            .then(
                function (data) {
                    return res.json(data);
                },
                function (err) {
                    console.log('Something went wrong!', err);
                }
            );
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong!' });
    }
});

module.exports = router;
