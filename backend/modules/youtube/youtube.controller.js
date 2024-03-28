const ytdl = require('ytdl-core');
const usetube = require('usetube');
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('@cyclic.sh/s3fs')(process.env.CYCLIC_BUCKET_NAME);

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

        const audioStream = ytdl(currentVideoID, {
            format: highestAudioFormat,
        });
        const buffers = [];

        audioStream.on('data', (chunk) => {
            buffers.push(chunk);
        });

        audioStream.on('end', async () => {
            console.log('Audio download completed.');

            try {
                // Combine all buffers into a single buffer
                const audioBuffer = Buffer.concat(buffers);
                // Write the buffer to S3
                await fs.writeFile(fileName, audioBuffer, (err) => {
                    if (err) {
                        console.error('Error saving audio to S3:', err);
                        res.status(500).json({
                            success: false,
                            msg: 'Error saving audio to S3',
                        });
                    } else {
                        console.log('Audio saved to S3 successfully.');

                        // Start ffmpeg process to convert the audio to mp3
                        const ffmpegProcess = spawn(ffmpeg, [
                            '-i',
                            `s3://${process.env.CYCLIC_BUCKET_NAME}/${fileName}`,
                            '-codec:a',
                            'libmp3lame',
                            '-q:a',
                            '0',
                            '-f',
                            'mp3',
                            'pipe:1',
                        ]);

                        ffmpegProcess.stdout.pipe(res);

                        ffmpegProcess.on('close', async () => {
                            console.log('Audio conversion completed.');

                            // Delete temporary audio file from S3
                            // Delete temporary audio file from S3
                            await fs.unlink(fileName, (err) => {
                                if (err) {
                                    console.error(
                                        'Error deleting temporary audio file from S3:',
                                        err
                                    );
                                } else {
                                    console.log(
                                        'Temporary audio file deleted from S3.'
                                    );
                                }
                            });

                            res.end();
                        });
                    }
                });
            } catch (error) {
                console.error('Error saving audio to S3:', error);
                res.status(500).json({
                    success: false,
                    msg: 'Error saving audio to S3',
                });
            }
        });

        audioStream.on('error', (error) => {
            console.error('Error downloading audio:', error);
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
