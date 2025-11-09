const map = L.map('map');

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
             {
               attribution: '&copy; OpenStreetMap contributors'
             }).addTo(map);

map.locate({ setView: true, maxZoom:13 });
map.on('locationfound', function (e) {
  L.marker(e.latlng).addTo(map)
    .bindPopup("📍 You are here")
    .openPopup();
});
map.on('locationerror', function() {
  map.setView([32.9858, -96.7501], 12);
});

const reportEl = document.getElementById("report");
const imageEl = document.getElementById("image_url");
const resultEl = document.getElementById("result");

map.on("click", async (e) => {
  const { lat, lng } = e.latlng;
  const text = reportEl.value.trim();
  const image_url = imageEl.value.trim();

  if(!text) {
    resultEl.innerHTML = "please describe the situation first!";
    return;
  }

  resultEl.innerHTML = "Analyzing...";

  try {
    const textRes = await fetch("/analyze-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const textData = await textRes.json();

    let imageData = {};
    if (image_url) {
      const imgRes = await fetch("/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url })
      });
      imageData = await imgRes.json();
    }

    const riskRes = await fetch(`/predict-risk?lat=${lat}&lon=${lng}`);
    const riskData = await riskRes.json();

    resultEl.innerHTML = `
      <strong>📍 Location:</strong> ${lat.toFixed(3)}, ${lng.toFixed(3)}<br>
      <strong>🧠 Text Sentiment:</strong> ${textData.label} (${textData.score})<br>
      ${image_url ? `<strong>🖼️ Image Label:</strong> ${imageData.label} (${imageData.score})<br>` : ""}
      <strong>🌧️ Rainfall:</strong> ${riskData.rainfall}mm<br>
      <strong>⚠️ Risk Level:</strong> ${riskData.predicted_risk}
    `;

    const alertMsg = new SpeechSynthesisUtterance(`Risk level is ${riskData.predicted_risk}`);
    speechSynthesis.speak(alertMsg);

    L.marker([lat, lng]).addTo(map)
      .bindPopup(`Risk: ${riskData.predicted_risk}`)
      .openPopup();
  } catch (err) {
    resultEl.innerHTML = "❌ Error analyzing data. Check your inputs.";
    console.error(err);
  }
});

const dropzone = document.getElementById("image-dropzone");
const imageFileInput = document.getElementById("image_file");
let uploadedImage = null;

dropzone.addEventListener("click", () => {
  imageFileInput.click();
});

imageFileInput.addEventListener("change", (e) => {
  uploadedImage = e.target.files[0];
  dropzone.textContent = uploadedImage.name;
});

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  uploadedImage = e.dataTransfer.files[0];
  dropzone.textContent = uploadedImage.name;
});

let imageData = {};
if (uploadedImage) {
    const formData = new FormData();
    formData.append("image_file", uploadedImage);

    const imgRes = await fetch("/analyze-image-file", {
        method: "POST",
        body: formData
    });
    imageData = await imgRes.json();
}


const panel = document.getElementById("panel");
const reportBox = document.getElementById("report");

reportBox.addEventListener("focus", () => {
  panel.classList.add("active");
});

document.addEventListener("click", (e) => {
  if (!panel.contains(e.target)) {
    panel.classList.remove("active");
  }
});
