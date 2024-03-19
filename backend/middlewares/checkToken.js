const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const SpotifyWebApi = require('spotify-web-api-node');
const clerkClient = require('@clerk/clerk-sdk-node');

const client = jwksClient({
    jwksUri:
        'https://current-quagga-17.clerk.accounts.dev/.well-known/jwks.json',
});
const getKey = (header, callback) => {
    client.getSigningKey(header.kid, (err, key) => {
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
};

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

const CheckToken = (req, res, next) => {
    try {
        const provider = 'oauth_spotify';
        const authorizationHeader =
            req.headers.Authorization || req.headers.authorization;
        const access_token = authorizationHeader
            ? authorizationHeader.split(' ')[1]
            : null;
        let subash = '';
        if (!access_token) {
            return res.status(401).json({ error: 'No Access Token' });
        }
        jwt.verify(access_token, getKey, (err, decoded) => {
            if (err) {
                return next(err);
            }
            req.userID = decoded.sub;
            clerkClient.users
                .getUserOauthAccessToken(decoded.sub, provider)
                .then((c) => {
                    req.spotifyToken = c[0].token;
                    next();
                })
                .catch((e) => next(e));
        });
    } catch (error) {
        console.log('Error Occured during checkingToken', error);
        res.json('Error Occured during checkingToken');
    }
};

module.exports = CheckToken;
