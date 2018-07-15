class Memory {
    constructor(address,port) {
        this.bids = [];
        this.closedBids = [];
    }

    addBid(bid) {
        this.bids.push(bid);
    }

    getBidById(id) {
        return this.bids.find(b => b.id == id);
    }

    updateOffer(bid,offer){
        var index = this.bids.findIndex(b => b.id == bid.id);
        this.bids[index].maxOffer = offer;
    }

    closeBid(id){
        var index = this.bids.findIndex(b => b.id == id)
        var bid = this.bids.find(b => b.id == id)
        
        if (index > -1) {
            this.bids.splice(index, 1);
        }
        this.closedBids.push(bid)
    }
}

module.exports = Memory;