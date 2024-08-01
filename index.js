import { exec } from "child_process";
import { log } from "console";
import cors from "cors";
import dotenv from "dotenv";
import voice from "elevenlabs-node";
import express from "express";
import { promises as fs } from "fs";
import OpenAI from "openai";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import multer from "multer";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// openai
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "-", // Your OpenAI API key here, I used "-" to avoid errors when the key is not set but you should not do that
});
// --

// elevenLab
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "21m00Tcm4TlvDq8ikWAM";
// --

// MS
const subscriptionKey = process.env.SUBSCRIPTIONKEY;
const serviceRegion = process.env.SERVICEREGION;
// --

// TU
const api_key = process.env.APIKEY;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json({ limit: "50mb", extended: true }));

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "dist")));

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Catch-all handler for any request that doesn't match an API route
app.get("/Avatar", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.post("/record", upload.single("recording"), async (req, res) => {
  console.log("/record");
  const { buffer: recording } = req.file;
  const PathLike = "audios/recording.wav";

  try {
    await fs.writeFile(PathLike, recording);

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    speechConfig.speechRecognitionLanguage = "th-TH";
    const audioData = await fs.readFile(PathLike);
    let audioConfig = sdk.AudioConfig.fromWavFileInput(audioData);
    let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    speechRecognizer.recognizeOnceAsync(async function (result) {
      var sttData = "";
      if (result.text) {
        sttData = result.text;
      }
      console.log("Text = " + sttData);
      res.status(201).send(sttData);
      speechRecognizer.close();
    });
  } catch (err) {
    console.error("Error processing recording:", err);
    res.status(500).send("Error processing recording");
  }
});

app.get("/voices", async (req, res) => {
  res.send(await voice.getVoices(elevenLabsApiKey));
});

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
  // Deployed version
  await execCommand(
    `.\\ffmpeg\\bin\\ffmpeg.exe -y -i audios/message_${message}.mp3 audios/message_${message}.wav`
    // `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`
    // -y to overwrite the file
  );
  console.log(`Conversion done in ${new Date().getTime() - time}ms`);
  await execCommand(
    `.\\bin\\rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
  );
  // -r phonetic is faster but less accurate
  console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
};

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const userHistory = history_formatting(req.body.history, true);

  if (!userMessage) {
    res.send({
      messages: [
        {
          text: "Hey dear... How was your day?",
          audio: await audioFileToBase64("audios/intro_0.wav"),
          lipsync: await readJsonTranscript("audios/intro_0.json"),
          facialExpression: "smile",
          animation: "Talking_1",
        },
        {
          text: "I missed you so much... Please don't go for so long!",
          audio: await audioFileToBase64("audios/intro_1.wav"),
          lipsync: await readJsonTranscript("audios/intro_1.json"),
          facialExpression: "sad",
          animation: "Crying",
        },
      ],
    });
    return;
  }
  if (!elevenLabsApiKey || openai.apiKey === "-") {
    res.send({
      messages: [
        {
          text: "Please my dear, don't forget to add your API keys!",
          audio: await audioFileToBase64("audios/api_0.wav"),
          lipsync: await readJsonTranscript("audios/api_0.json"),
          facialExpression: "angry",
          animation: "Angry",
        },
        {
          text: "You don't want to ruin Wawa Sensei with a crazy ChatGPT and ElevenLabs bill, right?",
          audio: await audioFileToBase64("audios/api_1.wav"),
          lipsync: await readJsonTranscript("audios/api_1.json"),
          facialExpression: "smile",
          animation: "Laughing",
        },
      ],
    });
    return;
  }

  if (userMessage == "avatar_start_hello") {
    res.send({
      messages: [
        {
          text: "สวัสดีค่ะ! ดิฉันแคทลีน, จะมาเป็นผู้ช่วยที่ พร้อมจะช่วยเสนอแนะและตอบคำถามของคุณทุกคำถามที่เกี่ยวข้องกับความรู้ที่ดิฉันมีได้ค่ะ! หากคุณมีคำถามหรือต้องการความช่วยเหลือ สามารถเรียกใช้บริการดิฉันได้เลยค่ะ",
          html: "สวัสดีค่ะ! ดิฉันแคทลีน, จะมาเป็นผู้ช่วยที่ พร้อมจะช่วยเสนอแนะและตอบคำถามของคุณทุกคำถามที่เกี่ยวข้องกับความรู้ที่ดิฉันมีได้ค่ะ! หากคุณมีคำถามหรือต้องการความช่วยเหลือ สามารถเรียกใช้บริการดิฉันได้เลยค่ะ",
          audio: await audioFileToBase64("audios/hello_0.wav"),
          lipsync: await readJsonTranscript("audios/hello_0.json"),
          facialExpression: "smile",
          animation: "Talking_0",
        },
      ],
    });
    return;
  }

  // const completion = await openai.chat.completions.create({
  //   model: "gpt-3.5-turbo-1106",
  //   max_tokens: 1000,
  //   temperature: 0.6,
  //   response_format: {
  //     type: "json_object",
  //   },
  //   messages: [
  //     {
  //       role: "system",
  //       content: `
  //       You are a Avatar.
  //       You will always reply with a JSON array of messages. With a maximum of 3 messages.
  //       Each message has a text, facialExpression, and animation property.
  //       The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
  //       The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.
  //       `,
  //     },
  //     {
  //       role: "user",
  //       content: userMessage || "Hello",
  //     },
  //   ],
  // });

  // const completion = await tu_openai(userMessage);
  // const completion = mocupAnswer(userMessage);
  // const completion = await chat_api(userMessage, userHistory);
  let completion_json ;
  if (userMessage == "mflv[q") {
    let img1 = "https://media.istockphoto.com/id/2098359215/th/%E0%B8%A3%E0%B8%B9%E0%B8%9B%E0%B8%96%E0%B9%88%E0%B8%B2%E0%B8%A2/%E0%B9%81%E0%B8%99%E0%B8%A7%E0%B8%84%E0%B8%B4%E0%B8%94%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%94%E0%B8%B4%E0%B8%88%E0%B8%B4%E0%B8%97%E0%B8%B1%E0%B8%A5-%E0%B8%99%E0%B8%B1%E0%B8%81%E0%B8%98%E0%B8%B8%E0%B8%A3%E0%B8%81%E0%B8%B4%E0%B8%88%E0%B9%83%E0%B8%8A%E0%B9%89%E0%B9%81%E0%B8%A5%E0%B9%87%E0%B8%9B%E0%B8%97%E0%B9%87%E0%B8%AD%E0%B8%9B%E0%B8%9E%E0%B8%A3%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B9%81%E0%B8%94%E0%B8%8A%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%94%E0%B9%82%E0%B8%86%E0%B8%A9%E0%B8%93%E0%B8%B2%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A7%E0%B8%B4%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B2%E0%B8%B0%E0%B8%AB%E0%B9%8C%E0%B8%81%E0%B8%A5%E0%B8%A2%E0%B8%B8%E0%B8%97%E0%B8%98%E0%B9%8C%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94.jpg?s=1024x1024&w=is&k=20&c=fHsavC3OcjObDobIjDEJ3p9VgcoA_Desvp9B1OgPHic=";
    let img2 = "https://media.istockphoto.com/id/1939608350/th/%E0%B8%A3%E0%B8%B9%E0%B8%9B%E0%B8%96%E0%B9%88%E0%B8%B2%E0%B8%A2/%E0%B8%8A%E0%B8%B2%E0%B8%A2%E0%B8%A5%E0%B8%B0%E0%B8%95%E0%B8%B4%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B9%80%E0%B8%9B%E0%B9%87%E0%B8%99%E0%B8%9C%E0%B8%B9%E0%B9%89%E0%B9%83%E0%B8%AB%E0%B8%8D%E0%B9%88%E0%B8%A1%E0%B8%B5%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B8%AA%E0%B8%B8%E0%B8%82%E0%B9%82%E0%B8%94%E0%B8%A2%E0%B9%83%E0%B8%8A%E0%B9%89%E0%B9%81%E0%B8%A5%E0%B9%87%E0%B8%9B%E0%B8%97%E0%B9%87%E0%B8%AD%E0%B8%9B%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%9A%E0%B9%89%E0%B8%B2%E0%B8%99-%E0%B9%80%E0%B8%97%E0%B8%84%E0%B9%82%E0%B8%99%E0%B9%82%E0%B8%A5%E0%B8%A2%E0%B8%B5%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B9%81%E0%B8%99%E0%B8%A7%E0%B8%84%E0%B8%B4%E0%B8%94%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%97%E0%B9%8D%E0%B8%B2%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%8A%E0%B8%B2.jpg?s=1024x1024&w=is&k=20&c=pMINTPD_UOO-N_AVe44xmgvYMQTl39DZyOmYoHP84B8=";
    let video = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"

    const exBubble = {
      output: `ldkcnksdcpsac lkcmpwcmpdc lkcnpwmcpwmc lkmcpwmcp
          <img>${img1}<img>
          ldkcnksdcpsac lkcmpwcmpdc lkcnpwmcpwmc lkmcpwmcp
          <img>${img2}<img>
          ldkcnksdcpsac lkcmpwcmpdc lkcnpwmcpwmc lkmcpwmcp
          <video>${video}<video>`,
    };
    const completion = chat_formatting(exBubble);
    completion_json = JSON.parse(completion);
  } else {
    const completion = await chat_api2(userMessage, userHistory);
    completion_json = JSON.parse(completion);
  }
  //   const completion = await set_api(userMessage, userHistory);

  // const completion_json = completion;

  console.log(completion_json);
  let messages = completion_json.choices[0].message.content;
  if (messages.indexOf("```json") >= 0) {
    console.log("Found JSON");
    messages = messages.split("```json")[1].split("```")[0];
    messages = JSON.parse(messages);
  }
  if (messages.messages) {
    messages = messages.messages; // ChatGPT is not 100% reliable, sometimes it directly returns an array and sometimes a JSON object with a messages property
  }
  if (messages.indexOf("```json") >= 0) {
    console.log("Found JSON");
    messages = messages.split("```json")[1].split("```")[0];
    messages = JSON.parse(messages);
  }
  console.log(messages);
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    if (!message.text) {
      message.text = "ขออภัยค่ะ กรุณาลองใหม่อีกครั้ง";
    }

    // generate audio file
    const fileName = `audios/message_${i}.mp3`; // The name of your audio file
    const textInput = message.text; // The text you wish to convert to speech
    console.log("Generating audio for: " + textInput);

    // generate audio
    // elevenLabs
    // await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, textInput, 0.5, 0.5, "eleven_multilingual_v2");

    // MS
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    speechConfig.speechSynthesisOutputFormat = 5;
    speechConfig.speechSynthesisLanguage = "th-TH";
    speechConfig.speechSynthesisVoiceName = "th-TH-PremwadeeNeural"; //NiwatNeural, PremwadeeNeural, AcharaNeural
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(fileName);
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
    var countLoop = 0;
    synthesizer.speakTextAsync(
      textInput,
      async (result) => {
        console.log("Speech synthesized");
        // generate lipsync
        await lipSyncMessage(i);
        message.audio = await audioFileToBase64(fileName);
        message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
        if (countLoop == messages.length - 1) {
          res.send({ messages });
        }
        countLoop++;
        synthesizer.close();
      },
      (error) => {
        console.error(`Error: ${error}`);
        synthesizer.close();

        res.send({ messages });
      }
    );
  }

  // res.send({ messages });
});

const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

app.listen(port, () => {
  console.log(`Avatar listening on port ${port}`);
});

function mocupAnswer(message) {
  console.log(message);
  const jsonReturn = {
    choices: [
      {
        content_filter_results: {
          hate: {
            filtered: false,
            severity: "safe",
          },
          self_harm: {
            filtered: false,
            severity: "safe",
          },
          sexual: {
            filtered: false,
            severity: "safe",
          },
          violence: {
            filtered: false,
            severity: "safe",
          },
        },
        finish_reason: "stop",
        index: 0,
        logprobs: null,
        message: {
          content:
            '```json\n[\n    {\n        "text": "วันนี้ลองทานข้าวมันไก่กันไหมคะ? เป็นอาหารที่ทั้งอร่อยและทำง่ายเลยล่ะค่ะ",\n        "facialExpression": "smile",\n        "animation": "Talking_0"\n    },\n    {\n        "text": "หรือถ้าอยากลองอะไรใหม่ๆ สลัดผักกับไก่ย่างก็เป็นตัวเลือกที่ดีนะคะ ทั้งสดชื่นและมีประโยชน์ด้วยค่ะ",\n        "facialExpression": "smile",\n        "animation": "Talking_1"\n    },\n    {\n        "text": "และอย่าลืมดื่มน้ำเยอะๆ นะคะ ช่วยให้ร่างกายสดชื่นและมีพลังในการทำงานค่ะ",\n        "facialExpression": "smile",\n        "animation": "Talking_2"\n    }\n]\n```',
          role: "assistant",
        },
      },
    ],
    created: 1715573903,
    id: "chatcmpl-9OHQlbRVpkH7A2VODThPQexsfCNwp",
    model: "gpt-4",
    object: "chat.completion",
    prompt_filter_results: [
      {
        prompt_index: 0,
        content_filter_results: {
          hate: {
            filtered: false,
            severity: "safe",
          },
          self_harm: {
            filtered: false,
            severity: "safe",
          },
          sexual: {
            filtered: false,
            severity: "safe",
          },
          violence: {
            filtered: false,
            severity: "safe",
          },
        },
      },
    ],
    system_fingerprint: "fp_2f57f81c11",
    usage: {
      completion_tokens: 311,
      prompt_tokens: 123,
      total_tokens: 434,
    },
  };
  let contentJson = [
    {
      text: "",
      facialExpression: "smile",
      animation: "Talking_0",
    },
  ];
  if (message.indexOf("ปัญหานี้") != -1) {
    contentJson = [
      {
        text: "จากฐานข้อมูลที่มี, position 14±0.01 mm ของชิ้นงาน Turbine Housing B10 ถูกสร้างขึ้นจากกระบวนการที่ 1 และกระบวนการที่ 3 ในไลน์ผลิต M147 ค่ะ จึงเป็นไปได้สูงว่าปัญหานี้ อาจเกิดจาก 1 ใน 2 กระบวนการนี้ค่ะ",
        html: "จากฐานข้อมูลที่มี, position 14±0.01 mm ของชิ้นงาน Turbine Housing B10 ถูกสร้างขึ้นจากกระบวนการที่ 1 และกระบวนการที่ 3 ในไลน์ผลิต M147 ค่ะ จึงเป็นไปได้สูงว่าปัญหานี้ อาจเกิดจาก 1 ใน 2 กระบวนการนี้ค่ะ",
        facialExpression: "smile",
        animation: "Talking_0",
      },
    ];
  } else if (message.indexOf("แล้วพอแนะนำ") != -1) {
    contentJson = [
      {
        text: "ปัญหาด้าน position นั้น เมื่ออ้างอิงจากปัญหาก่อน ๆ ที่เคยได้รับ การแก้ไขแล้ว ปัญหาด้าน position ส่วนมากจะเกิดจากปัจจัย ดังต่อไปนี้ค่ะ 1. การเข้าแก้ไข program CNC โดยพลการ ส่งผลให้ position ของชิ้นงานผิดเพี้ยนค่ะ โดยปัญหานี้สามารถแก้ไขได้ โดยการนำ program เดิมกลับมาค่ะ 2. พนักงานใส่ชิ้นงานเข้าเครื่องจักรผิดวิธี ซึ่งปัญหานี้สามารถแก้ไขชั่วคราวได้โดยการอบรมพนักงานอีกครั้ง หรือสามารถแก้ไขถาวรได้โดยการทำ Poka Yoke ป้องกันการใส่ชิ้นงานที่ไม่ถูกต้องค่ะ 3. Tool หมดอายุ ส่งผลให้ position ของงานเสียหายค่ะ ซึ่งสามารถตรวจสอบอายุของ tool ได้ที่เครื่องจักรของกระบวนการที่ 1 และกระบวนการที่ 3 ค่ะ",
        html: "ปัญหาด้าน position นั้น เมื่ออ้างอิงจากปัญหาก่อน ๆ ที่เคยได้รับ การแก้ไขแล้ว ปัญหาด้าน position ส่วนมากจะเกิดจากปัจจัย ดังต่อไปนี้ค่ะ <br><br>1. การเข้าแก้ไข program CNC โดยพลการ ส่งผลให้ position ของชิ้นงานผิดเพี้ยนค่ะ โดยปัญหานี้สามารถแก้ไขได้ โดยการนำ program เดิมกลับมาค่ะ <br><br>2. พนักงานใส่ชิ้นงานเข้าเครื่องจักรผิดวิธี ซึ่งปัญหานี้สามารถแก้ไขชั่วคราวได้โดยการอบรมพนักงานอีกครั้ง หรือสามารถแก้ไขถาวรได้โดยการทำ Poka Yoke ป้องกันการใส่ชิ้นงานที่ไม่ถูกต้องค่ะ <br><br>3. Tool หมดอายุ ส่งผลให้ position ของงานเสียหายค่ะ ซึ่งสามารถตรวจสอบอายุของ tool ได้ที่เครื่องจักรของกระบวนการที่ 1 และกระบวนการที่ 3 ค่ะ",
        facialExpression: "smile",
        animation: "Talking_1",
      },
    ];
  } else if (message.indexOf("ใครควรแก้") != -1) {
    contentJson = [
      {
        text: "รายชื่อพนักงานประจำสัปดาห์ DLG020143 นายสมหมาย สุขใจ DLG020144 นายสมศรี สมาน DLG020145 นายสมศักดิ์ รัชชา DLG020146 นายรพีย์ พัฒน์",
        html: "<u>รายชื่อพนักงานประจำสัปดาห์</u> <br><br>DLG020143 นายสมหมาย สุขใจ <br>DLG020144 นายสมศรี สมาน <br>DLG020145 นายสมศักดิ์ รัชชา <br>DLG020146 นายรพีย์ พัฒน์",
        facialExpression: "smile",
        animation: "Talking_1",
      },
    ];
  } else if (message.indexOf("ขอช่องทาง") != -1) {
    contentJson = [
      {
        text: "ติดต่อ DLG020146 นายรพีย์ พัฒน์ Tel 061-2343214 E-mail Rapee.P@mail.com ตำแหน่ง Repairman",
        html: "<u>ติดต่อ</u> <br><br>DLG020146 นายรพีย์ พัฒน์ <br>Tel: 061-2343214 <br>E-mail: Rapee.P@mail.com <br>ตำแหน่ง: Repairman",
        facialExpression: "smile",
        animation: "Talking_1",
      },
    ];
  } else if (message.indexOf("ช่วยส่งเมล") != -1) {
    contentJson = [
      {
        text: "ดำเนินการส่งอีเมลไปที่ Rapee.P@mail.com ให้แล้วค่ะ ข้อมูล DLG020146 นายรพีย์ พัฒน์",
        html: "ดำเนินการส่งอีเมลไปที่ Rapee.P@mail.com ให้แล้วค่ะ <br><u>ข้อมูล</u> DLG020146 นายรพีย์ พัฒน์",
        facialExpression: "smile",
        animation: "Talking_1",
      },
    ];
  } else {
    contentJson = [
      {
        text: "ต้องการสอบถามเรื่ออื่นเพิ่มเติมไหมคะ",
        html: "ต้องการสอบถามเรื่ออื่นเพิ่มเติมไหมคะ",
        facialExpression: "smile",
        animation: "Talking_0",
      },
    ];
  }

  jsonReturn.choices[0].message.content =
    "```json" + JSON.stringify(contentJson) + "```";
  return JSON.stringify(jsonReturn);
}

async function set_api(userMessage, chat_history) {
  console.log("set_api() called");

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    question: userMessage,
    chat_history: chat_history,
  });
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const response = await fetch(
    "https://set-demo-chatbot.azurewebsites.net/v1/chat",
    // "https://80b2-2001-fb1-3e-8d4e-e472-7ddc-941e-cb4d.ngrok-free.app/v1/chat",
    requestOptions
  );

  const result = await response.text();
  const data = JSON.parse(result);

  console.log(chat_formatting(data.message));

  return chat_formatting(data.message);
}

async function chat_api2(userMessage, chat_history) {
  console.log("chat_api() called");

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    query: userMessage,
    user_id: "demo avatar",
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const response = await fetch(
    "https://set-uat-first.azurewebsites.net/v1/chat",
    // "https://80b2-2001-fb1-3e-8d4e-e472-7ddc-941e-cb4d.ngrok-free.app/v1/chat",
    requestOptions
  );

  const result = await response.text();
  const data = JSON.parse(result);

  console.log(chat_formatting(data.message));

  return chat_formatting(data.message);
}

async function chat_api(userMessage, chat_history) {
  console.log("chat_api() called");

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    query: userMessage,
    enable_chat_history: true,
    chat_history: chat_history,
    facialExpression: "smile",
  });
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const response = await fetch(
    "http://52.163.77.237:8086/ultimate_v1/chat",
    requestOptions
  );

  const result = await response.text();
  const data = JSON.parse(result);

  console.log(chat_formatting(data.message));

  return chat_formatting(data.message);
}

function chat_formatting(data) {
  console.log("chat_formatting() called");
  console.log(data);
  const jsonReturn = {
    choices: [
      {
        message: {
          content: "",
        },
      },
    ],
  };
  let text = data.output.replace(/<[^>]*>[^<]*<[^>]*>/g, '');
  let html = data.output.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/<img>(.*?)<img>/g, '<img src="$1" />');
  html = html.replace(/<video>(.*?)<video>/g, `<video controls>
  <source src="$1" type="video/mp4">
Your browser does not support the video tag.
</video>`);
  console.log(`text: ${text}`);
  console.log(`html: ${html}`);
  let contentJson = [
    {
      text: text,
      html: html,
      facialExpression: "smile",
      animation: "Talking_0",
    },
  ];
  jsonReturn.choices[0].message.content =
    "```json" + JSON.stringify(contentJson) + "```";
  return JSON.stringify(jsonReturn);
}
function history_formatting(data, set) {
  console.log("history_formatting() called");
  const returnList = set
    ? []
    : [
        {
          Human: "",
          AI: `Part name:	Turbine Housing B10
    Line:	M147
    Problem:	เครื่อง CMM ตรวจพบ position ที่สูงเกินกว่าที่ drawing กำหนด โดย drawing กำหนดระยะไว้ที่ 14±0.01 mm แต่วัดจริงได้ 14.017 mm โปรดเร่งเข้าแก้ไข เพื่อไม่ให้กระทบต่อยอดการผลิตรายวันค่ะ
    Date:	09/05/2024
    Time:	10:33 AM`,
        },
        {
          Human: "",
          AI: `สำหรับการแก้ไขปัญหาที่เกี่ยวข้องกับชิ้นส่วน "Turbine Housing B10" ในสายการผลิต M147 ที่เครื่อง CMM ตรวจพบว่า position ไม่ตรงตามที่แบบวาดกำหนด โดยมีรายละเอียดว่าแบบวาดกำหนดระยะไว้ที่ 14±0.01 mm แต่วัดจริงได้ 14.017 mm นั้น ควรถูกรับผิดชอบโดย:
      
      - ทีมช่างซ่อม ซึ่งประกอบไปด้วย:
        - นายสมหมาย สุขใจ (DLG020143)
        - นายสมศรี สมาน (DLG020144)
        - นายสมศักดิ์ รัชชา (DLG020145)
        - นายรพีย์ พัฒน์ (DLG020146)
        - นายจณัตว์ สุวรรณวงศ์ (DLG020147)
      
      - ผู้ประสานงาน ที่สามารถช่วยในการประสานงานและติดตามผลการแก้ไขปัญหา ได้แก่:
        - นางสาวสุดใจ ทดสอบ (DLG020148)
        - นางสาวกลม รักษา (DLG020149)
        - นางสาวไพลิน ขมิ้น (DLG020150)
      
      หากต้องการให้ดำเนินการส่งอีเมลแจ้งไปยังพนักงานที่เกี่ยวข้องเพื่อเร่งดำเนินการแก้ไขปัญหานี้ กรุณาแจ้งให้ทราบค่ะ`,
        },
        {
          Human: `ติดต่อ DLG020146 นายรพีย์ พัฒน์ Tel 061-2343214 E-mail Rapee.P@mail.com ตำแหน่ง Repairman`,
          AI: `ติดต่อ DLG020146 นายรพีย์ พัฒน์ Tel 061-2343214 E-mail Rapee.P@mail.com ตำแหน่ง Repairman`,
        },
        {
          Human: `ผู้ส่งชื่อ GenWiz ตำแหน่ง Knowledge Intelligence E-mail liubei.dw7@gmail.com`,
          AI: `ผู้ส่งชื่อ GenWiz ตำแหน่ง Knowledge Intelligence E-mail liubei.dw7@gmail.com`,
        },
      ];
  for (let i = 0; i < data.length; i += 2) {
    const item = data[i];
    if (i != data.length - 1) {
      returnList.push({
        Human: data[i].text,
        AI: data[i + 1].text,
      });
    }
  }

  return returnList;
}

async function tu_openai(userMessage) {
  console.log("test() called");

  const myHeaders = new Headers();
  myHeaders.append("api-key", api_key);
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    messages: [
      {
        role: "system",
        content: `
        You are a Avatar.
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

  console.log(result);

  return result;
}
