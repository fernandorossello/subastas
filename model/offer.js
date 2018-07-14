class Offer {
    constructor(buyer,bidID,price) {
        this.buyer = buyer;
        this.price = price;
        this.bidID = bidID;
        this.status = undefined;
    }
}

module.exports = Offer;