import assert from "node:assert/strict";
import test from "node:test";
import { adaptWebGlQuality, createWebGlFpsState } from "./webglQuality";

test("adaptive WebGL quality drops after two slow sampling windows", () => {
  const firstWindow = adaptWebGlQuality(createWebGlFpsState("high"), 35);
  assert.equal(firstWindow.quality, "high");

  const secondWindow = adaptWebGlQuality(firstWindow, 38);
  assert.equal(secondWindow.quality, "medium");
  assert.equal(secondWindow.slowWindows, 0);
});

test("adaptive WebGL quality rises only after four fast sampling windows", () => {
  let state = createWebGlFpsState("low");
  for (let index = 0; index < 3; index += 1) state = adaptWebGlQuality(state, 60);
  assert.equal(state.quality, "low");

  state = adaptWebGlQuality(state, 60);
  assert.equal(state.quality, "medium");
  assert.equal(state.fastWindows, 0);
});

test("a neutral FPS window resets adaptation hysteresis", () => {
  const slowWindow = adaptWebGlQuality(createWebGlFpsState("high"), 35);
  const neutralWindow = adaptWebGlQuality(slowWindow, 50);
  const nextSlowWindow = adaptWebGlQuality(neutralWindow, 35);

  assert.equal(nextSlowWindow.quality, "high");
  assert.equal(nextSlowWindow.slowWindows, 1);
});

test("adaptive quality stays inside its supported bounds", () => {
  let low = createWebGlFpsState("low");
  low = adaptWebGlQuality(adaptWebGlQuality(low, 30), 30);
  assert.equal(low.quality, "low");

  let high = createWebGlFpsState("high");
  for (let index = 0; index < 4; index += 1) high = adaptWebGlQuality(high, 120);
  assert.equal(high.quality, "high");
});
