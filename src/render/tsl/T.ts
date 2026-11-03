/**
 * Loosely-typed TSL entry point. @types/three's TSL generics are extremely strict
 * (e.g. color vs vec3 nodes) which makes shader authoring slow without adding
 * safety at runtime, so shader code imports TSL through this `any` façade.
 * Everything outside shader graphs stays strictly typed.
 */
import * as TSL from 'three/tsl';
/* eslint-disable @typescript-eslint/no-explicit-any */
export type N = any;
export const T: any = TSL;
