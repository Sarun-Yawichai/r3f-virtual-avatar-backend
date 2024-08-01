import { exec } from "child_process";
import voice from "elevenlabs-node";
import dotenv from "dotenv";
dotenv.config();
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "21m00Tcm4TlvDq8ikWAM";

async function main() {
    lipSyncMessage(0);
}

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

const lipSyncMessage = async (message) => {
  const time = new Date().getTime();
  console.log(`Starting conversion for message ${message}`);
  await execCommand(
    `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`
    // -y to overwrite the file
  );
  console.log(`Conversion done in ${new Date().getTime() - time}ms`);
  await execCommand(
    `.\\bin\\rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
  );
  // -r phonetic is faster but less accurate
  console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
};

async function getVoices() {
  const voices = await voice.getVoices(elevenLabsApiKey);
  console.log(voices);
}

async function textToSpeech() {
  const fileName = `audios/message.mp3`;
  await voice.textToSpeech(
    elevenLabsApiKey,
    voiceID,
    fileName,
    "สวัสดีค่ะ! วันนี้เป็นอย่างไรบ้างคะ?",
    0.5,
    0.5,
    "eleven_multilingual_v2"
  );
}

async function tu_openai(userMessage) {
  console.log("test() called");

  const myHeaders = new Headers();
  myHeaders.append("api-key", "3900439147e8421b88153819ea0adab8");
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    messages: [
      {
        role: "system",
        content: `
          You are a virtual girlfriend.
          You will always reply with a JSON array of messages. With a maximum of 3 messages.
          Each message has a text, facialExpression, and animation property.
          The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
          The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry. 
          `,
      },
      {
        role: "user",
        content: userMessage || "Hello",
      },
    ],
    temperature: 0.5,
    stream: false,
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const response = await fetch(
    "https://tu-openai.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview",
    requestOptions
  );

  const result = await response.text();

  return result;
}

main();
