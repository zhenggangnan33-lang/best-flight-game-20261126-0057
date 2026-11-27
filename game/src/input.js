// Keyboard and pointer input for Aurora Squadron. Held keys steer and work the
// throttle; one-shot presses (confirm, action, pause, hangar, feats) are queued as
// bit flags and taken once by the loop, so a press between two frames is never
// lost and never counted twice.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HANGAR = 4;
export const ACTION_FEATS = 8;
export const ACTION_BACK = 16;

const THROTTLE_UP = new Set(['ArrowUp', 'KeyW']);
const THROTTLE_DOWN = new Set(['ArrowDown', 'KeyS']);
const TURN_LEFT = new Set(['ArrowLeft', 'KeyA']);
const TURN_RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const HANGAR = new Set(['KeyH']);
const FEATS = new Set(['KeyF']);

export function createInput(target) {
  let throttleUp = false;
  let throttleDown = false;
  let turnLeft = false;
  let turnRight = false;
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (THROTTLE_UP.has(event.code)) throttleUp = true;
    else if (THROTTLE_DOWN.has(event.code)) throttleDown = true;
    else if (TURN_LEFT.has(event.code)) turnLeft = true;
    else if (TURN_RIGHT.has(event.code)) turnRight = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE | ACTION_BACK;
    } else if (HANGAR.has(event.code)) {
      if (!event.repeat) actions |= ACTION_HANGAR;
    } else if (FEATS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_FEATS;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (THROTTLE_UP.has(event.code)) throttleUp = false;
    else if (THROTTLE_DOWN.has(event.code)) throttleDown = false;
    else if (TURN_LEFT.has(event.code)) turnLeft = false;
    else if (TURN_RIGHT.has(event.code)) turnRight = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    throttleUp = false;
    throttleDown = false;
    turnLeft = false;
    turnRight = false;
  });
  target.addEventListener('pointerdown', () => {
    actions |= ACTION_CONFIRM;
  });

  return {
    /** -1 to throttle down, 1 to throttle up, 0 for neither or both. */
    throttle() {
      return (throttleUp ? 1 : 0) - (throttleDown ? 1 : 0);
    },
    /** -1 for left, 1 for right, 0 for neither or both. */
    turn() {
      return (turnRight ? 1 : 0) - (turnLeft ? 1 : 0);
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
