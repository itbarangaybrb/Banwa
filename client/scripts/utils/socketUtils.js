export const sockets = {};
const handlers = {};

export function initSocket(name, url, onMessage) {
    if (!handlers[name]) handlers[name] = new Set();
    handlers[name].add(onMessage);

    if (sockets[name]) return;

    const state = { retryCount: 0 };
    const MAX_RETRIES = 10;
    const BASE_DELAY = 1000;
    const MAX_DELAY = 30000;

    function connect() {
        if (sockets[name]) return;

        const socket = new WebSocket(url);

        socket.addEventListener("open", () => {
            console.log(`[${name}] Connected`);
            state.retryCount = 0;
        });

        socket.addEventListener("message", (event) => {
            try {
                const data = JSON.parse(event.data);
                handlers[name]?.forEach(handler => {
                    try {
                        handler(data);
                    } catch (err) {
                        console.error(`[${name}] Handler error`, err);
                    }
                });
            } catch (err) {
                console.error(`[${name}] Parse error`, err);
            }
        });

        socket.addEventListener("close", () => {
            delete sockets[name];

            if (state.retryCount >= MAX_RETRIES) {
                console.error(`[${name}] Max retries reached. Giving up.`);
                return;
            }

            const delay = Math.min(BASE_DELAY * 2 ** state.retryCount + Math.random() * 500, MAX_DELAY);
            console.warn(`[${name}] Reconnecting in ${Math.round(delay)}ms... (attempt ${state.retryCount + 1})`);
            state.retryCount++;
            setTimeout(connect, delay);
        });

        socket.addEventListener("error", (err) => {
            console.error(`[${name}] Error`, err);
        });

        sockets[name] = socket;
    }

    connect();
}