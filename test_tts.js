import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import dotenv from "dotenv";
dotenv.config();

// Replace with your own subscription key and service region
const subscriptionKey = process.env.SUBSCRIPTIONKEY;
const serviceRegion = process.env.SERVICEREGION;
const speechConfig = sdk.SpeechConfig.fromSubscription(
  subscriptionKey,
  serviceRegion
);
speechConfig.speechSynthesisLanguage = "th-TH";
speechConfig.speechSynthesisVoiceName = "th-TH-PremwadeeNeural";
const audioConfig = sdk.AudioConfig.fromAudioFileOutput("output.mp3");
const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

async function main() {
  await stt("สวัสดีค่ะ! ดิฉันแคทลีน, จะมาเป็นผู้ช่วยที่ พร้อมจะช่วยเสนอแนะและตอบคำถามของคุณทุกคำถามที่เกี่ยวข้องกับความรู้ที่ดิฉันมีได้ค่ะ! หากคุณมีคำถามหรือต้องการความช่วยเหลือ สามารถเรียกใช้บริการดิฉันได้เลยค่ะ");
}

async function stt(text) {
  synthesizer.speakTextAsync(
    text,
    (result) => {
      console.log("Speech synthesized");
      synthesizer.close();
    //   resolve();
    },
    (error) => {
      console.error(`Error: ${error}`);
      synthesizer.close();
    //   reject(error);
    }
  );
}

main().catch((error) => {
  console.error(error);
});
