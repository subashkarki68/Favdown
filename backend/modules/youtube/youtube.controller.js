const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const ytdl = require('ytdl-core');
const usetube = require('usetube');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

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
        const audioStream = ytdl(videoId, { format: highestAudioFormat });

        console.log('Storing audio file to S3...');
        const uploadParams = {
            Bucket: 'cyclic-cute-cyan-caiman-yoke-ap-northeast-2',
            Key: 'some_files/audio.webm',
            Body: audioStream,
        };
        await s3.upload(uploadParams).promise();
        console.log('Audio file stored to S3 successfully.');

        console.log('Retrieving audio file from S3...');
        const getObjectParams = {
            Bucket: 'cyclic-cute-cyan-caiman-yoke-ap-northeast-2',
            Key: 'some_files/audio.webm',
        };
        const { Body: audioFile } = await s3
            .getObject(getObjectParams)
            .promise();
        console.log('Audio file retrieved from S3 successfully.');

        const ffmpegProcess = spawn(ffmpeg, [
            '-i',
            'pipe:0', // Read from stdin
            '-codec:a',
            'libmp3lame',
            '-q:a',
            '0',
            '-f',
            'mp3', // Output format
            'pipe:1', // Write to stdout
        ]);

        res.setHeader(
            'Content-disposition',
            `attachment; filename="${videoInfo.videoDetails.title}.mp3"`
        );
        res.setHeader('Content-type', 'audio/mpeg');

        audioFile.pipe(ffmpegProcess.stdin);
        ffmpegProcess.stdout.pipe(res);

        ffmpegProcess.stderr.on('data', (data) => {
            console.error(`ffmpeg error: ${data}`);
        });

        ffmpegProcess.on('exit', (code, signal) => {
            console.log(`ffmpeg exited with code ${code} and signal ${signal}`);
        });
    } catch (error) {
        console.error('Error fetching video data:', error.message);
        return res.status(500).json({
            success: false,
            msg: 'Error fetching video data',
        });
    }
};
