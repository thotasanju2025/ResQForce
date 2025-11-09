const map = L.map('map');

map.locate({ setView: true, maxZoom:13});
map.on('locationfound', function (e) 
       {
         L.markeer(e.latlng).addTo(map)
         .bindPopup("📍 You are here")
         .openPopup();
       });
map.on('locationerror", function() 
       {
          map.setView([32.9858, -96.7501], 12);
       }); 
L.titleLayer('https://{s}.title.openstreetmap.org/{z}/{x}/{y}.png', 
             {
               attribution: '&copy; OpenStreetMap contributors'
             }).addTo(map);
const reportEl = document.getElementById("report");
const imageEl = document.getElementById("image_url");
const resultEl = document.getElementById("result");

map.on("click", async (e) => 
  {
    const ( lat, lng } = e.latlng;
    const test = reportEl.value.trim();
    const image_url = imaageEl.value.trim();

    if(!text)
    {
      resultEl.innerHTML = "please describe the situation first!";
      return;
    }

    resultEl.innerHTML = "Analyzing...";

    try
    {
      const textRes = await fetch("/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ text })
    });
    const textData = await textRes.json();

    let imageData = {};
    if (image_url)
    {
      const imgRes = await fethc("/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url })  
    });
    imageData = await imgRes.json();
    }
    const riskRes = await fetch(` /predict-risk?lat=${lat}&lon=${lng}`);
    const riskData = await riskRes.json();

    resultEl.innerHTML =
      <strong>📍 Location:</strong> ${lat.toFixed(3)}, ${lng.toFixed(3)}<br>
      <strong>🧠 Text Sentiment:</strong> ${textData.label} (${textData.score})<br>
      ${image_url ? `<strong>🖼️ Image Label:</strong> ${imageData.label} (${imageData.score})<br>` : ""}
      <strong>🌧️ Rainfall:</strong> ${riskData.rainfall}mm<br>
      <strong>⚠️ Risk Level:</strong> ${riskData.predicted_risk}
    ;

    L.marker([lat, lng]).addTo(map).bindPopup(`Risk: ${riskData.predicted_risk}`).openPopup();
  } catch (err) {
    resultEl.innerHTML = "❌ Error analyzing data. Check your inputs.";
    console.error(err);
  }
  });
