## API Report File for "api-extractor-scenarios"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @public (undocumented)
export class ClassWithGenericMethod {
    // (undocumented)
    method<T>(): void;
}

// @public (undocumented)
export class GenericClass<T> {
}

// @public (undocumented)
export class GenericClassWithConstraint<T extends string> {
}

// @public (undocumented)
export class GenericClassWithDefault<T = number> {
}

// @public (undocumented)
export function genericFunction<T>(): void;

// @public (undocumented)
export interface GenericInterface<T> {
}

// @public (undocumented)
export type GenericTypeAlias<T> = T;

// @public (undocumented)
export interface InterfaceWithGenericCallSignature {
    // (undocumented)
    <T>(): void;
}

// @public (undocumented)
export interface InterfaceWithGenericConstructSignature {
    // (undocumented)
    new <T>(): T;
}


// (No @packageDocumentation comment for this package)

```