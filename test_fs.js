import { promises as fs } from "fs";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import dotenv from "dotenv";
dotenv.config();

// MS Speech SDK configuration
const subscriptionKey = process.env.SUBSCRIPTIONKEY;
const serviceRegion = process.env.SERVICEREGION;

// Path to the WAV file
const wavFilePath = "audios/message_1.wav";

// This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
speechConfig.speechRecognitionLanguage = "en-US";

async function fromFile() {
    try {
        const audioData = await fs.readFile(wavFilePath);
        let audioConfig = sdk.AudioConfig.fromWavFileInput(audioData);
        let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        speechRecognizer.recognizeOnceAsync(result => {
            switch (result.reason) {
                case sdk.ResultReason.RecognizedSpeech:
                    console.log(`RECOGNIZED: Text=${result.text}`);
                    break;
                case sdk.ResultReason.NoMatch:
                    console.log("NOMATCH: Speech could not be recognized.");
                    break;
                case sdk.ResultReason.Canceled:
                    const cancellation = sdk.CancellationDetails.fromResult(result);
                    console.log(`CANCELED: Reason=${cancellation.reason}`);

                    if (cancellation.reason == sdk.CancellationReason.Error) {
                        console.log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
                        console.log(`CANCELED: ErrorDetails=${cancellation.errorDetails}`);
                        console.log("CANCELED: Did you set the speech resource key and region values?");
                    }
                    break;
            }
            speechRecognizer.close();
        });
    } catch (error) {
        console.error("Error reading file:", error);
    }
}
fromFile();

