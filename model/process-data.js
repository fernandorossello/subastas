class ProcessData {
    constructor(address,port) {
        this.id = 1;
        this.address = address;
        this.port = parseInt(port, 10);
        this.replica = this.port +1;
    }
}

module.exports = ProcessData;