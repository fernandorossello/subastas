class Buyer {
    constructor(name,address,port,tags) {
        this.name = name
        this.address = address;
        this.port = port;
        this.tags = tags;
    }

    url(){
        return this.address + ':' + this.port;
    }

    isInterested(tags){
        return this.tags.some(r=> tags.includes(r))
    }
}

module.exports = Buyer;