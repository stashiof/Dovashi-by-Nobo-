const WebSocket = require('ws');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API key");
    process.exit(1);
}

const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
    ws.send(JSON.stringify({
        setup: {
            model: "models/gemini-2.0-flash-exp",
            generationConfig: {
                responseModalities: ["AUDIO"]
            }
        }
    }));
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    console.log("Received:", Object.keys(msg));
    if (msg.setupComplete) {
        console.log("Setup complete. Sending text...");
        ws.send(JSON.stringify({
            clientContent: {
                turns: [
                    { role: "user", parts: [{ text: "Hello, say the word PING out loud." }] }
                ],
                turnComplete: true
            }
        }));
    }
    if (msg.serverContent) {
        console.log("Server content:", JSON.stringify(msg.serverContent).substring(0, 200));
    }
});
