import OpenAI, { toFile } from "openai";

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no está configurado");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Transcribe an audio or video file using OpenAI Whisper API.
 * Whisper natively supports: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm.
 * For video files, Whisper extracts the audio track automatically.
 */
export async function transcribeAudio(file: File): Promise<string> {
  const client = getClient();

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name?.split(".").pop() || (file.type?.startsWith("video/") ? "mp4" : "ogg");
  const uploadable = await toFile(buffer, file.name || `input.${ext}`);

  const transcription = await client.audio.transcriptions.create({
    model: "whisper-1",
    file: uploadable,
  });

  const text = transcription.text?.trim();
  if (!text) {
    throw new Error("La transcripción resultó vacía");
  }

  return text;
}
