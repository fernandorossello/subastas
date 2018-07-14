class Offer {
    constructor(id, buyer,bidID,price) {
        this.id = id;
        this.buyer = buyer;
        this.price = price;
        this.bidID = bidID;
        this.status = undefined;
    }
}

module.exports = Offer;