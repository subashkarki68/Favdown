const s3fs = require('@cyclic.sh/s3fs/promises');
const ytdl = require('ytdl-core');
const usetube = require('usetube');
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const bucketName = process.env.CYCLIC_BUCKET_NAME;
const fs = s3fs(bucketName);

exports.downloadAudio = async (req, res) => {
    try {
        console.log('Searching for video...');
        const result = await usetube.searchVideo(`${req.query.t} lyrics`);
        console.log('Video search successful.');
        let currentVideoID = result.videos[0].id;
        const totalResults = result.videos.length;
        const validID = ytdl.validateID(currentVideoID);

        while (totalResults > 0 && !validID) {
            if (validID) {
                break;
            }

            console.error('Video ID is not valid, trying next ID...');
            if (result.videos.length > 1) {
                currentVideoID = result.videos[1].id;
                result.videos.shift();
            } else {
                console.error('No valid video IDs found');
                return res.status(404).json({
                    success: false,
                    msg: 'No valid video IDs found',
                });
            }
        }
        console.log('Fetching video information...');
        const videoInfo = await ytdl.getInfo(currentVideoID);
        console.log('Video information fetched successfully.');

        const audioFormats = ytdl.filterFormats(videoInfo.formats, 'audioonly');
        if (audioFormats.length === 0) {
            return res.status(404).json({
                success: false,
                msg: 'No audio formats available for the video',
            });
        }

        console.log('Audio formats available for the video.');

        const highestAudioFormat = audioFormats[0];
        const fileName = `${videoInfo.videoDetails.title}-${Date.now()}.mp3`;
        console.log('Filename set:', fileName);

        console.log('Setting response header');
        res.setHeader(
            'Content-disposition',
            `attachment; filename="${fileName}"`
        );
        res.setHeader('Content-type', 'audio/mpeg');

        console.log('Response Header set successfully');

        const audioStream = ytdl(currentVideoID, {
            format: highestAudioFormat,
        });

        const tempFilePath = '/tmp/audio.webm'; // Temporarily store audio on server

        audioStream
            .pipe(fs.createWriteStream(tempFilePath)) // Store audio on S3
            .on('finish', async () => {
                console.log('Audio download completed.');
                const ffmpegProcess = spawn(ffmpeg, [
                    '-i',
                    tempFilePath,
                    '-codec:a',
                    'libmp3lame',
                    '-q:a',
                    '0',
                    fileName,
                ]);
                ffmpegProcess.on('close', async () => {
                    console.log('Audio conversion completed.');
                    const fileData = await fs.readFile(fileName);
                    res.send(fileData);
                    await fs.unlink(tempFilePath); // Cleanup temp files
                    await fs.unlink(fileName);
                    console.log('Files deleted successfully.');
                });
            })
            .on('error', (err) => {
                console.error('Error downloading audio:', err);
                res.status(500).json({
                    success: false,
                    msg: 'Error downloading audio',
                });
            });
    } catch (error) {
        console.error('Error fetching video data:', error.message);
        return res.status(500).json({
            success: false,
            msg: 'Error fetching video data',
        });
    }
};
