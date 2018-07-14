class UniqueIDGenerator {
    constructor() {
    }

    getUID() {
        return Math.random().toString(36).substr(2, 4);
      };
}

module.exports = UniqueIDGenerator;
