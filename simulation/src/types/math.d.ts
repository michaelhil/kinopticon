/**
 * Mathematical types for 3D simulation
 */
export interface Vector3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}
export interface Quaternion {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
}
export interface Transform {
    readonly position: Vector3;
    readonly rotation: Quaternion;
    readonly scale: Vector3;
}
/**
 * Vector3 utility functions
 */
export declare const Vector3Utils: {
    zero: () => Vector3;
    one: () => Vector3;
    add: (a: Vector3, b: Vector3) => Vector3;
    subtract: (a: Vector3, b: Vector3) => Vector3;
    multiply: (v: Vector3, scalar: number) => Vector3;
    magnitude: (v: Vector3) => number;
    normalize: (v: Vector3) => Vector3;
    dot: (a: Vector3, b: Vector3) => number;
    cross: (a: Vector3, b: Vector3) => Vector3;
};
/**
 * Quaternion utility functions
 */
export declare const QuaternionUtils: {
    identity: () => Quaternion;
    fromEuler: (x: number, y: number, z: number) => Quaternion;
    toEuler: (q: Quaternion) => Vector3;
    multiply: (a: Quaternion, b: Quaternion) => Quaternion;
    normalize: (q: Quaternion) => Quaternion;
};
/**
 * Transform utility functions
 */
export declare const TransformUtils: {
    identity: () => Transform;
    combine: (parent: Transform, child: Transform) => Transform;
};
//# sourceMappingURL=math.d.ts.map