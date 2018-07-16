const maxBids = 3;

class Memory {
    constructor() {
        this.bids = [];
        this.closedBids = [];
        this.buyers = [];
    }

    isFull(){
        return (this.bids.length + this.closedBids.length) >= maxBids;
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

    closeBid(id,status){
        var index = this.bids.findIndex(b => b.id == id)
        var bid = this.bids.find(b => b.id == id)
        bid.status = status;
        if (index > -1) {
            this.bids.splice(index, 1);
        }
        this.closedBids.push(bid)
    }
}

module.exports = Memory;