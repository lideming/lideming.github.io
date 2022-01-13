let counter = 0;
while(1) {
    if (++counter >= 1e8) { // 1 million
        postMessage(1);
        counter = 0;
    }
}
