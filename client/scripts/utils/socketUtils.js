export const sockets = {};

export function initSocket(name, url, onMessage) {
    if (sockets[name]) {
        console.warn(`Socket "${name}" is already initialized`);
        return;
    }

    const socket = new WebSocket(url);

    // socket.addEventListener("open", () => {
    //     console.log(`${name} WebSocket connected`);
    // });

    socket.addEventListener("message", (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (err) {
            console.error(`${name} WS message parse error`, err);
        }
    });

    socket.addEventListener("close", () => {
        console.log(`${name} WebSocket disconnected, reconnecting...`);
        delete sockets[name];
        setTimeout(() => initSocket(name, url, onMessage), 3000);
    });

    socket.addEventListener("error", (err) => {
        console.error(`${name} WebSocket error`, err);
    });

    sockets[name] = socket;
}
