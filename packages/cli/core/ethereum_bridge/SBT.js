const crypto = require('crypto');

class SBT {
    /**
     * @param {Object} params
     * @param {string} params.title - Title of the achievement
     * @param {string} params.description - Description
     * @param {string} params.type - ACHIEVEMENT, SKILL, REPUTATION
     * @param {Object} params.issuer - Who issued it (project_id, signature)
     * @param {Object} params.recipient - Who received it (persona_hash)
     * @param {Object} params.evidence - Proof of work (zk_proof, metadata)
     */
    constructor({ title, description, type, issuer, recipient, evidence }) {
        this.id = crypto.randomUUID();
        this.title = title;
        this.description = description;
        this.type = type || 'ACHIEVEMENT';
        this.issuer = issuer || {};
        this.recipient = recipient || {};
        this.evidence = evidence || {};
        this.timestamp = new Date().toISOString();
        
        // Generate integrity signature
        this.signature = this.sign();
    }

    sign() {
        const payload = `${this.id}|${this.title}|${this.timestamp}|${JSON.stringify(this.issuer)}`;
        return crypto.createHash('sha256').update(payload).digest('hex');
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            type: this.type,
            issuer: this.issuer,
            recipient: this.recipient,
            evidence: this.evidence,
            timestamp: this.timestamp,
            signature: this.signature
        };
    }
}

module.exports = SBT;
