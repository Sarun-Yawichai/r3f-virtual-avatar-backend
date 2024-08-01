var recorder = {
  stream: undefined,
  audioContext: undefined,
  recorder: undefined,
  STT_result: "",
  stopType: "",
  audio: {
    count: 0,
    sum: 0,
    time: 24,
    sec: 0,
    average: 0,
  },
};

function playRecording() {
  const audio = document.getElementById("audio");
  const phraseInput = document.getElementById("phrase");
  // const backendUrl = "http://localhost:3000";
  const backendUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':3000' : ''}`;
  fetch(
    backendUrl +
      "/text-to-speech2?file=true&region=southeastasia&key=a12a843db5d94c2da96aed60396de276&phrase=" +
      phraseInput.value
  )
    .then((response) => response.blob())
    .then((blob) => {
      const audioURL = URL.createObjectURL(blob);
      audio.src = audioURL;
      audio.addEventListener("loadedmetadata", () => {
        audio.play();
      });
    })
    .catch((error) => {
      console.error("Error fetching audio:", error);
    });
}

async function startRecording() {
  // console.log("startRecording() called");

  recorder.audio = {
    count: 0,
    sum: 0,
    time: 24,
    sec: recorder.audio.time,
    average: 0,
  };

  var constraints = { audio: true };
  recorder.stream = await navigator.mediaDevices.getUserMedia(constraints);

  if (!recorder.audioContext) {
    // console.log("===============!recorder.audioContext=====================");
    recorder.audioContext = window.AudioContext || window.webkitAudioContext;
    recorder.audioContext = new AudioContext();
  }

  var analyser = recorder.audioContext.createAnalyser();
  var input = recorder.audioContext.createMediaStreamSource(recorder.stream);
  var scriptProcessor = recorder.audioContext.createScriptProcessor(2048, 1, 1);

  input.connect(analyser);
  analyser.connect(scriptProcessor);
  scriptProcessor.connect(recorder.audioContext.destination);

  scriptProcessor.onaudioprocess = function () {
    const array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    const arraySum = array.reduce((a, value) => a + value, 0);
    const average = arraySum / array.length;
    // webchat.webchat_element.icon_close.style.pointerEvents = "unset";
    console.log(average + "--------avg--- ");
    // cutAudio(average);
  };

  recorder.recorder = new WebAudioRecorder(input, {
    workerDir: "../js/",
    encoding: "wav",
    numChannels: 1,
    onEncoderLoading: function (recorder, encoding) {
      // console.log("Loading " + encoding + " encoder...");
    },
    onEncoderLoaded: function (recorder, encoding) {
      // console.log(encoding + " encoder loaded");
    },
  });
  recorder.recorder.onComplete = function (_recorder, blob) {
    // console.log("Encoding complete");
    // console.log(recorder);
    // console.log("recorder.audio.average : "+recorder.audio.average);
    recordComplete(blob, _recorder.encoding, recorder.audio.average);
  };
  recorder.recorder.setOptions({
    timeLimit: 120,
    encodeAfterRecord: true,
    ogg: { quality: 0.5 },
    mp3: { bitRate: 160 },
  });

  recorder.recorder.startRecording();
}

function stopRecording(stopType) {
  // console.log("stopRecording() call");

  recorder.audio.average = recorder.audio.sum / recorder.audio.count;

  recorder.stopType = stopType;
  recorder.stream.getAudioTracks()[0].stop();
  recorder.audioContext.close();
  recorder.audioContext = undefined;
  recorder.recorder.finishRecording();
}

async function recordComplete(blob, encoding, average) {
  // console.log("recordComplete() call");
  // console.log("stopType : " + recorder.stopType);
  if (recorder.stopType != "icon_close") {
    var average_os = 3;
    // userAgent = navigator.userAgent
    if (navigator.userAgent.match(/android/i)) {
      average_os = 2;
    }
    console.log(average + "avg in complece....");
    recorder.STT_result = await sttAPI(blob);
    document.getElementById("phrase").value = recorder.STT_result;
    playRecording();
    if (average >= average_os) {
      //   setReturnText(recorder.STT_result);
    } else {
      //   setReturnText();
    }
  }
  //   webchat.webchat_element.icon_microphone.style.pointerEvents = "unset";
}

async function sttAPI(blob) {
  var formdata = new FormData();
  formdata.append("recording", blob);

  var requestOptions = {
    method: "POST",
    body: formdata,
    redirect: "follow",
  };
  // const backendUrl = "http://localhost:3000";
  const backendUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':3000' : ''}`;
  const response = await fetch(backendUrl + "/record", requestOptions);
  const returnObject = await response.text();
  return returnObject;
}

function cutAudio(average) {
  var persenAverage = Math.round((Math.round(average) / 300) * 100);
  recorder.audio.count++;
  recorder.audio.sum += persenAverage;
  var persenaverage_os = 10;
  //userAgent = navigator.userAgent
  //   webchat.webchat_element.icon_microphone.style.pointerEvents = "none";

  if (navigator.userAgent.match(/android/i)) {
    persenaverage_os = 5;
  }
  if (persenAverage < persenaverage_os) {
    recorder.audio.sec--;
  } else {
    recorder.audio.sec = recorder.audio.time;
  }

  if (recorder.audio.sec == 0) {
    // webchat.webchat_element.icon_close.style.pointerEvents = "none";
    stopRecording();
    recorder.audio.sec = recorder.audio.time;
  }
}
