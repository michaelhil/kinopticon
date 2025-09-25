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
export const Vector3Utils = {
  zero: (): Vector3 => ({ x: 0, y: 0, z: 0 }),
  one: (): Vector3 => ({ x: 1, y: 1, z: 1 }),
  
  add: (a: Vector3, b: Vector3): Vector3 => ({
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  }),
  
  subtract: (a: Vector3, b: Vector3): Vector3 => ({
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  }),
  
  multiply: (v: Vector3, scalar: number): Vector3 => ({
    x: v.x * scalar,
    y: v.y * scalar,
    z: v.z * scalar
  }),
  
  magnitude: (v: Vector3): number => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),
  
  normalize: (v: Vector3): Vector3 => {
    const mag = Vector3Utils.magnitude(v);
    return mag > 0 ? Vector3Utils.multiply(v, 1 / mag) : Vector3Utils.zero();
  },
  
  dot: (a: Vector3, b: Vector3): number => a.x * b.x + a.y * b.y + a.z * b.z,
  
  cross: (a: Vector3, b: Vector3): Vector3 => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  })
};

/**
 * Quaternion utility functions
 */
export const QuaternionUtils = {
  identity: (): Quaternion => ({ x: 0, y: 0, z: 0, w: 1 }),
  
  fromEuler: (x: number, y: number, z: number): Quaternion => {
    const cx = Math.cos(x * 0.5);
    const sx = Math.sin(x * 0.5);
    const cy = Math.cos(y * 0.5);
    const sy = Math.sin(y * 0.5);
    const cz = Math.cos(z * 0.5);
    const sz = Math.sin(z * 0.5);

    return {
      x: sx * cy * cz - cx * sy * sz,
      y: cx * sy * cz + sx * cy * sz,
      z: cx * cy * sz - sx * sy * cz,
      w: cx * cy * cz + sx * sy * sz
    };
  },
  
  toEuler: (q: Quaternion): Vector3 => {
    // Roll (x-axis rotation)
    const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
    const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    // Pitch (y-axis rotation)
    const sinp = 2 * (q.w * q.y - q.z * q.x);
    let pitch;
    if (Math.abs(sinp) >= 1) {
      pitch = Math.PI / 2 * Math.sign(sinp); // Use 90 degrees if out of range
    } else {
      pitch = Math.asin(sinp);
    }

    // Yaw (z-axis rotation)
    const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
    const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return { x: roll, y: pitch, z: yaw };
  },
  
  multiply: (a: Quaternion, b: Quaternion): Quaternion => ({
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y + a.y * b.w + a.z * b.x - a.x * b.z,
    z: a.w * b.z + a.z * b.w + a.x * b.y - a.y * b.x,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
  }),
  
  normalize: (q: Quaternion): Quaternion => {
    const mag = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
    return mag > 0 ? {
      x: q.x / mag,
      y: q.y / mag,
      z: q.z / mag,
      w: q.w / mag
    } : QuaternionUtils.identity();
  }
};

/**
 * Transform utility functions
 */
export const TransformUtils = {
  identity: (): Transform => ({
    position: Vector3Utils.zero(),
    rotation: QuaternionUtils.identity(),
    scale: Vector3Utils.one()
  }),
  
  combine: (parent: Transform, child: Transform): Transform => {
    // This is a simplified transform combination
    // Real implementation would properly handle rotation and scaling
    return {
      position: Vector3Utils.add(parent.position, child.position),
      rotation: QuaternionUtils.multiply(parent.rotation, child.rotation),
      scale: {
        x: parent.scale.x * child.scale.x,
        y: parent.scale.y * child.scale.y,
        z: parent.scale.z * child.scale.z
      }
    };
  }
};