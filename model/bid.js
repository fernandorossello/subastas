class Bid {
    constructor(tags,price,duration, article) {
        this.id = undefined
        this.tags = tags;
        this.price = price;
        this.duration = duration;
        this.article = article;
        this.maxOffer = undefined;
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
}

module.exports = Bid;