self.addEventListener('message', (e) => {
    if (e.data.action == 'cpu') {
        stressCpu();
    } else if (e.data.action == 'mem') {
        stressMem(e.data);
    }
});

postMessage('ready');

function stressCpu() {
    while (1) {
        cpuPayload();
        postMessage('iteration');
    }
}

function cpuPayload() {
    let counter = 0;
    while (1) {
        if (++counter >= 1e7) { // 0.1 million
            return;
        }
    }
}

const memoryArray = [];

function stressMem(data) {
    const { size } = data;
    for (let i = 0; i < size; i += 128) {
        allocate(Math.min(128, size - i));
    }
}

function allocate(size) {
    const buffer = new Uint8Array(size * 1024 * 1024);
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = i % 256;
    }
    memoryArray.push(buffer);
    postMessage({
        action: 'mem',
        size: size,
    });
}