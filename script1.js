const video = document.getElementById("video");
let detectionTimer;
let isDetecting = false;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models"),
])
  .then(webCam) // Call webCam after models are loaded
  .catch((error) => {
    console.error("Error loading models:", error);
  });

function webCam() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error("Error accessing webcam:", error.name, error.message);
    });
}

video.addEventListener("play", () => {
  if (document.querySelector("canvas")) return;

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  const detectFaces = async () => {
    if (isDetecting) return;
    isDetecting = true;

    try {
      const detection = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);

      const resizedWindow = faceapi.resizeResults(detection, displaySize);

      faceapi.draw.drawDetections(canvas, resizedWindow);
      faceapi.draw.drawFaceLandmarks(canvas, resizedWindow);
      faceapi.draw.drawFaceExpressions(canvas, resizedWindow);

      resizedWindow.forEach((detection) => {
        const box = detection.detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: Math.round(detection.age) + " year old " + detection.gender,
        });
        drawBox.draw(canvas);
      });

    } catch (error) {
      console.error("Face detection error:", error);
    } finally {
      isDetecting = false;
      detectionTimer = window.setTimeout(detectFaces, 250);
    }
  };

  detectFaces();
});

window.addEventListener("beforeunload", () => {
  window.clearTimeout(detectionTimer);
  video.srcObject?.getTracks().forEach((track) => track.stop());
});
