
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function loadFFmpeg() {
    if (ffmpeg) return ffmpeg;

    ffmpeg = new FFmpeg();

    // Load ffmpeg.wasm from a CDN (reliable for now)
    // In production, you might want to host these files in 'public/'
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    return ffmpeg;
}

export async function compressVideo(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const ffmpeg = await loadFFmpeg();

    const { name } = file;
    const inputName = 'input.mp4'; // Normalize name for FFmpeg
    const outputName = 'output.mp4';

    // Write file to FFmpeg FS
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Compression Log
    ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Log]:', message);
    });

    // Progress Handler
    ffmpeg.on('progress', ({ progress }) => {
        if (onProgress) onProgress(Math.round(progress * 100));
    });

    // Run Compression Command
    // -c:v libx264: Use H.264 codec
    // -crf 28: Constant Rate Factor (23 is default, 28 is higher compression/lower quality)
    // -preset faster: Tradeoff speed vs efficiency
    await ffmpeg.exec([
        '-i', inputName,
        '-c:v', 'libx264',
        '-crf', '28',
        '-preset', 'faster',
        outputName
    ]);

    // Read the result
    const data = await ffmpeg.readFile(outputName);

    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return new Blob([data as any], { type: 'video/mp4' });
}
