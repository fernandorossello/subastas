class ProcessData {
    constructor(id,address,port) {
        this.id = id;
        this.address = address;
        this.port = parseInt(port, 10);
        this.replica = this.port +1;
    }
}

module.exports = ProcessData;