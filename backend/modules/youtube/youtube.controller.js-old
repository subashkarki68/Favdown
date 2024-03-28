const fs = require('fs');
const ytdl = require('ytdl-core');
const usetube = require('usetube');
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');

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
                break; // Found a valid video ID, exit the loop
            }

            console.error('Video ID is not valid, trying next ID...');
            if (result.videos.length > 1) {
                currentVideoID = result.videos[1].id; // Use the next video ID
                result.videos.shift(); // Remove the first video from the array
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
        // If there are no audio formats available, return error
        if (audioFormats.length === 0) {
            return res.status(404).json({
                success: false,
                msg: 'No audio formats available for the video',
            });
        }

        console.log('Audio formats available for the video.');

        // Choose the highest quality audio format
        const highestAudioFormat = audioFormats[0];
        // Set filename using the video title
        const fileName = `${videoInfo.videoDetails.title}-${Date.now()}.mp3`;
        console.log('Filename set:', fileName);

        // Set response headers for file download
        console.log('Setting response header');
        res.setHeader(
            'Content-disposition',
            `attachment; filename="${fileName}"`
        );
        res.setHeader('Content-type', 'audio/mpeg');
        // Pipe the audio stream to ffmpeg to convert it to mp3 and then to response
        console.log('Response Header set successfully');

        ytdl(currentVideoID, { format: highestAudioFormat })
            .pipe(fs.createWriteStream('audio.webm'))
            .on('finish', () => {
                console.log('Audio download completed.');
                const ffmpegProcess = spawn(ffmpeg, [
                    '-i',
                    'audio.webm',
                    '-codec:a',
                    'libmp3lame',
                    '-q:a',
                    '0',
                    fileName,
                ]);
                ffmpegProcess.on('close', () => {
                    console.log('Audio conversion completed.');
                    // Normalize the audio using ffmpeg-normalize
                    // Stream the converted mp3 file to response
                    // fs.createReadStream(fileName).pipe(res);
                    const fileStream = fs.createReadStream(fileName);
                    fileStream.pipe(res);
                    fileStream.on('close', () => {
                        //Delete file after sending to the client
                        fs.unlink('audio.webm', (err) => {
                            if (err) {
                                console.error('Error Deleting audio.webm');
                            } else {
                                console.log('audio.webm deleted Successfully');
                            }
                        });
                        fs.unlink(fileName, (err) => {
                            if (err) {
                                console.error(
                                    `Error deleting file: ${fileName} from server:`,
                                    err
                                );
                            } else {
                                console.log(
                                    'File deleted successfully.',
                                    fileName
                                );
                            }
                        });
                    });
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
