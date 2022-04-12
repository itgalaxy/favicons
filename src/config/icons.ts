import { IconOptions } from "./defaults";

export function transparentIcon(width: number, height?: number): IconOptions {
  return {
    sizes: [{ width, height: height ?? width }],
    offset: 0,
    background: false,
    transparent: true,
    rotate: false,
  };
}

export function transparentIcons(...sizes: number[]): IconOptions {
  return {
    sizes: sizes.map((size) => ({ width: size, height: size })),
    offset: 0,
    background: false,
    transparent: true,
    rotate: false,
  };
}

export function opaqueIcon(width: number, height?: number): IconOptions {
  return {
    sizes: [{ width, height: height ?? width }],
    offset: 0,
    background: true,
    transparent: false,
    rotate: false,
  };
}

export function maskable(options: IconOptions): IconOptions {
  return { ...options, purpose: "maskable" };
}
