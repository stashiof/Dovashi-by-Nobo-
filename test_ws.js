import WebSocket from 'ws';

// Use a public key or a test key if we had one. Since we don't, we just test if the connection opens and stays open, or if it closes with 1008.
// Since we don't have a valid API key, it will close with 1008 regardless!
