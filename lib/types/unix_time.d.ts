import { Equatable } from './equatable';
export declare class UnixTime implements Equatable<UnixTime> {
    private readonly unixTime;
    constructor(unixTime: number);
    equals(unixTime: UnixTime): boolean;
    [Symbol.toPrimitive](hint?: string): number | string;
    toString(): string;
    valueOf(): number;
    toJSON(): number;
}
