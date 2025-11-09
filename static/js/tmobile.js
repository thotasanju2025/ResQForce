const sentimentEl = document.getElementById("sentiment_text");
const feedbackEl = document.getElementById("feedback_text");
const resultEl = document.getElementById("result");
const sendBtn = document.getElementById("sendFeedback");

sendBtn.addEventListener("click", async () => {
  const sentiment = sentimentEl.value.trim();
  const feedback = feedbackEl.value.trim();

  if(!sentiment && !feedback) {
    resultEl.innerHTML = "Please enter sentiment or feedback!";
    return;
  }

  resultEl.innerHTML = "Analyzing...";

  try {
    const sentimentRes = sentiment ? await fetch("/analyze-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sentiment })
    }) : null;

    const sentimentData = sentimentRes ? await sentimentRes.json() : { label: "N/A", score: 0 };

    const feedbackRes = feedback ? await fetch("/analyze-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: feedback })
    }) : null;

    const feedbackData = feedbackRes ? await feedbackRes.json() : { label: "N/A", score: 0 };

    resultEl.innerHTML = `
      <strong>🧠 Sentiment:</strong> ${sentimentData.label} (${sentimentData.score})<br>
      <strong>💬 Feedback Sentiment:</strong> ${feedbackData.label} (${feedbackData.score})
    `;

    const alertMsg = new SpeechSynthesisUtterance(`Sentiment analyzed: ${sentimentData.label}`);
    speechSynthesis.speak(alertMsg);

  } catch (err) {
    resultEl.innerHTML = "❌ Error analyzing feedback.";
    console.error(err);
  }
});
