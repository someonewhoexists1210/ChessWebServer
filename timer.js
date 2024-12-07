const raf = require("raf");

/**
 * Represents a timer that counts down from a specified duration.
 */
class Timer {
    /**
     * Creates a new instance of the Timer class.
     * @param {number} duration - The duration of the timer in milliseconds.
     * @param {Function} onComplete - The callback function to be called when the timer completes.
     */
    constructor(duration, onComplete) {
        this.duration = duration;
        this.onComplete = onComplete;
        this.remainingTime = duration;
        this.startTime = null;
        this.paused = false;
        this.rafId = null;
    }

    /**
     * Starts the timer.
     * @returns {number} The remaining time of the timer in milliseconds.
     */
    start() {
        if (this.paused) {
            this.paused = false;
            this.startTime = Date.now() - (this.duration - this.remainingTime);
        } else {
            this.startTime = Date.now();
            this.remainingTime = this.duration;
        }
        this.tick();
        return this.remainingTime;
    }

    /**
     * Pauses the timer.
     */
    pause() {
        if (!this.paused) {
            this.paused = true;
            raf.cancel(this.rafId);
        }
    }

    /**
     * Performs a tick of the timer.
     */
    tick() {
        if (this.remainingTime <= 0) {
            this.complete();
            return;
        }
        if (!this.paused) {
            const currentTime = Date.now();
            const elapsed = currentTime - this.startTime;
            this.remainingTime = this.duration - elapsed;
            if (this.remainingTime <= 0) {
                this.complete();
            } else {
                this.rafId = raf(() => this.tick());
            }
        }
    }

    /**
     * Completes the timer.
     */
    complete() {
        raf.cancel(this.rafId);
        if (typeof this.onComplete === 'function') {
            this.onComplete();
        }
    }
}

module.exports = {Timer};