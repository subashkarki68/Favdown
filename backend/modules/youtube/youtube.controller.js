const AWS = require('aws-sdk');
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const ytdl = require('ytdl-core');
const usetube = require('usetube');

// Initialize AWS SDK with your credentials
const s3 = new AWS.S3({
    accessKeyId: 'YOUR_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
});

exports.downloadAudio = async (req, res) => {
    try {
        console.log('Searching for video...');
        const result = await usetube.searchVideo(`${req.query.t} lyrics`);
        console.log('Video search successful.');

        if (!result || !result.videos || result.videos.length === 0) {
            throw new Error('No videos found');
        }

        const videoId = result.videos[0].id;
        console.log('Selected video ID:', videoId);

        console.log('Fetching video information...');
        const videoInfo = await ytdl.getInfo(videoId);
        console.log('Video information fetched successfully.');

        const audioFormats = ytdl.filterFormats(videoInfo.formats, 'audioonly');
        if (audioFormats.length === 0) {
            throw new Error('No audio formats available for the video');
        }

        console.log('Audio formats available for the video.');

        const highestAudioFormat = audioFormats[0];

        // Download audio stream from YouTube
        const audioStream = ytdl(videoId, { format: highestAudioFormat });

        // Upload audio file to S3 bucket
        const uploadParams = {
            Bucket: 'YOUR_S3_BUCKET_NAME',
            Key: `audio/${videoId}.mp3`,
            Body: audioStream,
        };
        await s3.upload(uploadParams).promise();
        console.log('Audio file uploaded to S3 successfully.');

        // Stream audio file from S3 to user's response
        const s3Params = {
            Bucket: 'YOUR_S3_BUCKET_NAME',
            Key: `audio/${videoId}.mp3`,
        };
        const s3Stream = s3.getObject(s3Params).createReadStream();

        res.setHeader(
            'Content-disposition',
            `attachment; filename="${videoInfo.videoDetails.title}.mp3"`
        );
        res.setHeader('Content-type', 'audio/mpeg');

        s3Stream.pipe(res);

        // Delete the file from S3 after streaming to user
        s3.deleteObject(
            { Bucket: 'YOUR_S3_BUCKET_NAME', Key: `audio/${videoId}.mp3` },
            (err, data) => {
                if (err) {
                    console.error('Error deleting file from S3:', err);
                } else {
                    console.log('File deleted from S3 successfully:', data);
                }
            }
        );
    } catch (error) {
        console.error('Error fetching video data:', error.message);
        return res.status(500).json({
            success: false,
            msg: 'Error fetching video data',
        });
    }
};
