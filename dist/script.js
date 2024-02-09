// Copyright 2023 The MediaPipe Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;
const demosSection = document.getElementById("demos");
const imageBlendShapes = document.getElementById("image-blend-shapes");
const videoBlendShapes = document.getElementById("video-blend-shapes");
let faceLandmarker;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
let webcams = [];
let currentWebCam = null;
let frameCount = 0;
let lastTime = Date.now();
let fps = 0;

let isRecording = false; // Indicates if currently recording
let recordedData = []; // Store recorded blend shapes data
const videoWidth = 480;
// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU",
    },
    outputFaceBlendshapes: true,
    runningMode,
    numFaces: 1,
  });
  demosSection?.classList.remove("invisible");
}
createFaceLandmarker();

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/
let video = document.getElementById("webcam");
let canvasElement = document.getElementById("output_canvas");
let canvasCtx = canvasElement.getContext("2d");
// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

async function setWebCam(deviceId) {
  video.remove();

  const prewebcam = document.querySelector(".prewebcam");
  prewebcam.innerHTML = `        
        <video id="webcam" autoplay playsinline></video>
        <canvas
          class="output_canvas"
          id="output_canvas"
          style="position: absolute; left: 0px; top: 0px"
        ></canvas>
    `;
  video = document.getElementById("webcam");
  canvasElement = document.getElementById("output_canvas");
  canvasCtx = canvasElement.getContext("2d");
  drawingUtils = new DrawingUtils(canvasCtx);
  setTimeout(() => {
    enableCam(null, deviceId)
  }, 2000);
//   setTimeout(() => {
//     enableCam(null, deviceId)
//   }, 4000);
}
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  const selectWebCamEl = document.getElementById("select-webcam");
  selectWebCamEl.onchange = (event) => {
    setWebCam(event.target.value);
  };
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    webcams = devices.filter((device) => device.kind === "videoinput");
    webcams.forEach((webcam) => {
      const option = document.createElement("option");
      option.value = webcam.deviceId;
      const label = webcam.label || `Camera ${count++}`;
      const textNode = document.createTextNode(label);
      option.appendChild(textNode);
      selectWebCamEl.appendChild(option);
    });
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
    setTimeout(enableCam, 2000);
  });
} else {
  console.warn("getUserMedia() is not supported by your browser");
}
// Enable the live webcam view and start detection.
function enableCam(event, deviceId) {
  if (!faceLandmarker) {
    console.log("Wait! faceLandmarker not loaded yet.");
    return;
  }
  if (webcamRunning === true && !deviceId) {
    webcamRunning = false;
    enableWebcamButton.innerHTML =
      '<i class="fa-regular fa-circle"></i> Tracking';
  } else {
    webcamRunning = true;
    enableWebcamButton.innerHTML =
      '<i class="fa-regular fa-circle-check"></i> Tracking';
  }
  // getUsermedia parameters.
  const constraints = {
    video: true,
  };
  if (deviceId) {
    constraints.video = { deviceId };
  }
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}
let lastVideoTime = -1;
let results = undefined;
let drawingUtils = new DrawingUtils(canvasCtx);
async function predictWebcam() {
  frameCount++;

  const radio = video.videoHeight / video.videoWidth;

  video.style.width = "100%"; // Stretch video to 100% width
  video.style.height = "auto"; // Let height be auto to maintain aspect ratio

  canvasElement.style.width = "100%"; // Stretch canvas display to 100% width
  canvasElement.style.height = "100%";

  canvasElement.width = video.videoWidth; // Actual drawing area width based on video
  canvasElement.height = video.videoHeight; // Actual drawing area height based on video

  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await faceLandmarker.setOptions({ runningMode: runningMode });
  }
  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = faceLandmarker.detectForVideo(video, startTimeMs);
  }
  if (results.faceLandmarks) {
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#fff", lineWidth: 2 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#e14eca", lineWidth: 2 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#fff", lineWidth: 2 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#e14eca", lineWidth: 2 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#E0E0E0", lineWidth: 2 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0", lineWidth: 2 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: "#00f2c3", lineWidth: 2 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: "#00f2c3", lineWidth: 2 }
      );
    }
  }
  drawBlendShapes(videoBlendShapes, results.faceBlendshapes);
  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;
    if (deltaTime >= 1000) {
      // 1000ms = 1s
      fps = frameCount;
      frameCount = 0;
      lastTime = currentTime;
    }
    canvasCtx.fillStyle = "white";
    canvasCtx.font = "24px Arial";

    // Flip the canvas horizontally
    canvasCtx.save(); // Save the current state
    canvasCtx.scale(-1, 1); // Apply horizontal flip

    // Adjust the X-coordinate for the flipped text (subtract the text width to position it correctly)
    const textWidth = canvasCtx.measureText(`FPS: ${fps}`).width;
    canvasCtx.fillText(`FPS: ${fps}`, -10 - textWidth, 30);

    canvasCtx.restore(); // Restore to the original state

    window.requestAnimationFrame(predictWebcam);
  }
}
function drawBlendShapes(el, blendShapes) {
  if (!blendShapes.length) {
    return;
  }

  // Record the data if in recording mode
  if (isRecording) {
    recordedData.push([...blendShapes[0].categories,
      {
        "index": blendShapes[0].categories.length,
        "score": fps,
        "categoryName": "fps",
        "displayName": "fps"
    }]);
  }

  let htmlMaker = "";

  blendShapes[0].categories.map((shape) => {
    htmlMaker += `
        <tr>
            <td>${shape.displayName || shape.categoryName}</td>
            <td class="text-center">
                <div class="progress-container progress-sm pl-3">
                    <div class="progress">
                        <span class="progress-value">${(+shape.score).toFixed(
                          4
                        )}</span>
                        <div class="progress-bar " role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: calc(${
                          +shape.score * 100
                        }% );"></div>
                    </div>
                </div>
            </td>
        </tr>`;
  });

  el.innerHTML = htmlMaker;
}

function convertToCSV(objArray) {
  const array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray;

  // Check if there's enough data
  if (array.length % 53 !== 0) {
    console.error(
      "Data doesn't appear to be a multiple of 53. Can't segment properly."
    );
    return "";
  }

  // Create header using the blendshape names from the first 53 blend shapes
  let header = array
    .slice(0, 53)
    .map((item) => item.displayName || item.categoryName)
    .join(",");
  let str = header + "\n";

  // Segment by each 53 shape keys
  for (let i = 0; i < array.length; i += 53) {
    let segment = array
      .slice(i, i + 53)
      .map((item) =>  item.score.toFixed(['fps'].includes(item.displayName) ? 0 : 4)  )
      .join(",");
    str += segment + "\n";
  }

  return str;
}

function downloadCSV(data) {
  if (data.length) {
    let csv = convertToCSV(data.flat());
    let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    let url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const dateIso = new Date().toISOString();
    link.setAttribute("download", `${dateIso}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function toggleRecording() {
  isRecording = !isRecording; // Toggle recording mode

  const recordButton = document.getElementById("recordButton");
  if (isRecording) {
    recordButton.innerHTML = '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Stop Recording';
    recordButton.className = 'btn btn-success';
    
    recordedData = []; // Reset the recorded data
  } else {
    recordButton.innerHTML = '<i class="fa-solid fa-circle"></i> Start Recording';
    recordButton.className = 'btn btn-primary';
    downloadCSV(recordedData); // Download the recorded data as CSV
  }
}
document
  .getElementById("recordButton")
  .addEventListener("click", toggleRecording);
