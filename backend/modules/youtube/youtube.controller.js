const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const ytdl = require('ytdl-core');
const usetube = require('usetube');

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

        res.setHeader(
            'Content-disposition',
            `attachment; filename="${videoInfo.videoDetails.title}.mp3"`
        );
        res.setHeader('Content-type', 'audio/mpeg');

        ytdl(videoId, { format: highestAudioFormat })
            .pipe(
                spawn(
                    ffmpeg,
                    [
                        '-i',
                        'pipe:0', // Read from stdin
                        '-codec:a',
                        'libmp3lame',
                        '-q:a',
                        '0',
                        '-f',
                        'mp3', // Output format
                        'pipe:1', // Write to stdout
                    ],
                    {
                        stdio: ['pipe', 'pipe', 'ignore'], // Ignore stderr
                    }
                ).stdout
            )
            .pipe(res);
    } catch (error) {
        console.error('Error fetching video data:', error.message);
        return res.status(500).json({
            success: false,
            msg: 'Error fetching video data',
        });
    }
};
