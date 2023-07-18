export declare class ArFSEntityCache<K, V> {
    private cache;
    constructor(capacity: number);
    cacheKeyString(key: K): string;
    put(key: K, value: Promise<V>): Promise<V>;
    get(key: K): Promise<V> | undefined;
    remove(key: K): void;
    clear(): void;
    size(): number;
}
