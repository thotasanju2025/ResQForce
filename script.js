const map = L.map('map');

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
             { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

map.locate({ setView: true, maxZoom:13 });
map.on('locationfound', function (e) {
    L.marker(e.latlng).addTo(map)
     .bindPopup("📍 You are here")
     .openPopup();
});
map.on('locationerror', function() {
    map.setView([32.9858, -96.7501], 12); // fallback: UTD area
});

let heatPoints = [];
const heatLayer = L.heatLayer(heatPoints, {
  radius: 25,
  blur: 15,
  maxZoom: 10,
  gradient: { 0.4: "blue", 0.6: "lime", 0.9: "red" }
}).addTo(map);

const reportEl = document.getElementById("report");
const imageEl = document.getElementById("image_url");
const resultEl = document.getElementById("result");
const panel = document.getElementById("panel");

reportEl.addEventListener("focus", () => { panel.classList.add("active"); });
document.addEventListener("click", (e) => { if (!panel.contains(e.target)) panel.classList.remove("active"); });

map.on("click", async (e) => {
  const { lat, lng } = e.latlng;
  const text = reportEl.value.trim();
  const image_url = imageEl.value.trim();

  if (!text) {
    resultEl.innerHTML = "Please describe the situation first!";
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
    alertMsg.rate = 1;
    alertMsg.pitch = 1;
    speechSynthesis.speak(alertMsg);

    const shareBtn = document.createElement("button");
    shareBtn.textContent = "📍 Share Alert";
    shareBtn.style.marginTop = "10px";
    shareBtn.style.background = "#ff4b4b";
    shareBtn.style.color = "white";
    shareBtn.style.border = "none";
    shareBtn.style.padding = "8px 12px";
    shareBtn.style.borderRadius = "8px";
    shareBtn.style.cursor = "pointer";
    resultEl.appendChild(shareBtn);

    shareBtn.onclick = () => {
      const shareText = `🚨 ResQForce Alert!\nLocation: ${lat.toFixed(3)}, ${lng.toFixed(3)}\nRisk: ${riskData.predicted_risk}\nRainfall: ${riskData.rainfall}mm`;
      navigator.clipboard.writeText(shareText);
      shareBtn.textContent = "✅ Copied!";
      setTimeout(() => (shareBtn.textContent = "📍 Share Alert"), 2000);
    };
  
    document.body.style.transition = "background 0.3s ease";
    document.body.style.background = "#fff2b2"; // light yellow flash
    setTimeout(() => document.body.style.background = "#f2f2f2", 300);

    L.marker([lat, lng]).addTo(map).bindPopup(`Risk: ${riskData.predicted_risk}`).openPopup();

    let intensity = riskData.predicted_risk === "HIGH" ? 1 :
                    riskData.predicted_risk === "MEDIUM" ? 0.6 : 0.3;
    heatPoints.push([lat, lng, intensity]);
    heatLayer.setLatLngs(heatPoints);

  } catch (err) {
    resultEl.innerHTML = "❌ Error analyzing data. Check your inputs.";
    console.error(err);
  }
});
