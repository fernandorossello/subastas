class ProcessData {
    constructor(address,port) {
        this.id = 1;
        this.address = address;
        this.port = parseInt(port, 10);
        this.replic = this.port +1;
    }
}

module.exports = ProcessData;