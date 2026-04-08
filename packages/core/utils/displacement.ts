import { Engine } from "../models/Engine";

/**
 * Helper to solve for stroke based on a target bore and displacement
 */
export const solveStroke = (engine: Engine, bore: number): string => {
  const vCylMm3 = (engine.displacement / engine.noCylinders) * 1_000_000;
  const stroke = vCylMm3 / (Math.PI * Math.pow(bore / 2, 2));
  return stroke.toFixed(2);
};