import { Equatable } from './equatable';
export declare class ByteCount implements Equatable<ByteCount> {
    private readonly byteCount;
    constructor(byteCount: number);
    [Symbol.toPrimitive](hint?: string): number | string;
    plus(byteCount: ByteCount): ByteCount;
    minus(byteCount: ByteCount): ByteCount;
    isGreaterThan(byteCount: ByteCount): boolean;
    isGreaterThanOrEqualTo(byteCount: ByteCount): boolean;
    toString(): string;
    valueOf(): number;
    toJSON(): number;
    equals(other: ByteCount): boolean;
}
