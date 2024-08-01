import fs from "fs";
import path from "path";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY2 || "-", // Your OpenAI API key here, I used "-" to avoid errors when the key is not set but you should not do that
});

const speechFile = path.resolve("./speech.mp3");

async function main() {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: "shimmer",
    input: "การลงทุนในดนตรีมักเป็นการลงทุนทางอ้อมผ่านกองทุนรวมหรือกองทุน ETF ค่ะ โดยทั่วไปมักลงทุนในบริษัทดนตรี สิทธิ์ในเพลง และธุรกิจที่เกี่ยวข้องกับดนตรี โดยการลงทุนประเภทนี้อาจมีความเสี่ยงสูง เนื่องจากขึ้นอยู่กับความสำเร็จของบริษัทหรือศิลปินที่ลงทุน รวมถึงความนิยมของแนวเพลงและเทรนด์ทางดนตรีด้วยค่ะ หากนักลงทุนมีความรู้ความเข้าใจในอุตสาหกรรมดนตรีเป็นอย่างดี และสามารถประเมินความเสี่ยงที่อาจเกิดขึ้นได้ ก็อาจพิจารณาลงทุนในสินทรัพย์ประเภทนี้ได้ค่ะ",
  });
  console.log(speechFile);
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}
main();
