class ProcessData {
    constructor(port) {
        this.port = port;
        this.replic = port+1;
    }
}

module.exports = ProcessData;