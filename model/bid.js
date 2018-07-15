class Bid {
    constructor(id,tags,price, duration, article) {
        this.id = id
        this.tags = tags;
        this.price = price;
        this.duration = duration;
        this.article = article;
        this.maxOffer = undefined;
        this.expiration = new Date().getTime() + duration;
        this.status = 'open'
    }

    currentMaxOffer() {
        if (this.maxOffer !== undefined){
            return this.maxOffer.price;
        } else {
            return this.price;
        }
    }

    winningBuyer() {
        return this.maxOffer.buyer;
    }

    isExpired() {
        return (new Date().getTime() > this.expiration);
    }

    extendTime(){
        this.expiration += 5000;
        this.duration += 5000;
    }
}

module.exports = Bid;