class Memory {
    constructor(address,port) {
        this.bids = [];
    }

    addBid(bid) {
        this.bids.push(bid);
    }

    removeBid(id){
        var index = this.bids.findIndex(b => b.id == id)
        if (index > -1) {
            this.bids.splice(index, 1);
        }
    }
}

module.exports = Memory;