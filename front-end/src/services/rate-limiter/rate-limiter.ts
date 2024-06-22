/**
 * Service that allows to:
 * - queue requests on the same limiter to execute them one by one
 * - make sure we always keep X ms between 2 executions, for example to avoid getting "rate limit exceeded" errors from third party api calls.
 */
import { sleep } from "@utils/sleep";
import Queue from "promise-queue";

type LimiterSettings = {
    /** Minimum time in milliseconds between 2 requests. Used to implement API call rate limits such as 'max 5 per second'. */
    minRequestsInterval: number;
}

type Limiter = {
    settings: LimiterSettings;
    queue: Queue;
}

let limitators: Map<string, Limiter> = new Map();

export const registerLimiter = (name: string, settings: LimiterSettings) => {
    let limitator: Limiter = {
        queue: new Queue(1),
        settings
    };

    limitators.set(name, limitator);
}

const getLimiter = (name: string): Limiter => {
    if (!limitators.has(name))
        throw new Error(`Rate limited ${name} has not been registered`);

    return limitators.get(name)!;
}

/**
 * Queues a dummy method that lasts N ms to make the singleton queue busy and simulate rate limiting.
 */
const applyPostRequestLimiterConditions = (limiter: Limiter) => {
    limiter.queue.add(() => sleep(limiter.settings.minRequestsInterval));
}

/**
 * Calls a method, making sure it is rate limited against other calls in the same limiter.
 */
export const rateLimitedCall = <T>(limiterName: string, action: () => Promise<T>) => {
    let limiter = getLimiter(limiterName);

    let promiseResult = limiter.queue.add(() => {
        return action();
    });

    applyPostRequestLimiterConditions(limiter);

    return promiseResult;
}
