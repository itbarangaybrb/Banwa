// No import needed — io is available globally from the script tag

const sockets = {};
const handlers = {};

export function initSocket(name, url, onMessage) {
    if (!handlers[name]) handlers[name] = new Set();
    handlers[name].add(onMessage);

    if (sockets[name]) return;

    const socket = io(url, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
    });

    socket.onAny((event, data) => {
        handlers[name]?.forEach(handler => {
            try {
                handler({ type: event, ...data });
            } catch (err) {
                // console.error(`[${name}] Handler error`, err);
                console.error(`[${name}] Handler error`);
            }
        });
    });

    // socket.on('connect', () => console.log(`[${name}] Connected`));
    // socket.on('disconnect', () => console.log(`[${name}] Disconnected`));
    // socket.on('connect_error', (err) => console.error(`[${name}] Connection error`, err.message));

    sockets[name] = socket;
}

export { sockets };