class Bid {
    constructor(id,tags,price, duration, article) {
        this.id = id
        this.tags = tags;
        this.price = price;
        this.duration = duration;
        this.article = article;
        this.maxOffer = undefined;
        this.expiration = new Date().getTime() + duration;
    }

    currentMaxOffer() {
        if (this.maxOffer !== undefined){
            return this.maxOffer.price;
        } else {
            return this.price;
        }
    }

    winningBuyer(){
        return this.maxOffer.buyer;
    }

    isExpired() {
        return (new Date().getTime() > this.expiration);
    }
}

module.exports = Bid;