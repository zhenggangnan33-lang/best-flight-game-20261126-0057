// Keyboard and mouse. The flight controls are keys; the menus are
// clickable buttons, so the game plays with keyboard and mouse as the
// bounty asks. Nothing here knows about the game — it only reports
// what is pressed and where the pointer is.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set(); // keys hit since the last read (edge triggers)
  const mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };

  const KEYMAP = {
    ArrowUp: 'throttleUp', KeyW: 'throttleUp',
    ArrowDown: 'throttleDown', KeyS: 'throttleDown',
    ArrowLeft: 'pitchUp', KeyA: 'pitchUp',
    ArrowRight: 'pitchDown', KeyD: 'pitchDown',
    KeyF: 'flaps',
    Space: 'drop',
    KeyP: 'pause',
    KeyM: 'mute',
    Enter: 'confirm',
    Escape: 'back',
  };

  function onKeyDown(e) {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!keys.has(action)) pressed.add(action);
    keys.add(action);
  }
  function onKeyUp(e) {
    const action = KEYMAP[e.code];
    if (action) keys.delete(action);
  }
  function onMouseMove(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  }
  function onMouseDown(e) {
    onMouseMove(e);
    mouse.clicked = true;
    mouse.clickX = mouse.x;
    mouse.clickY = mouse.y;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    // Held-state flight input for this frame.
    read() {
      return {
        throttleUp: keys.has('throttleUp'),
        throttleDown: keys.has('throttleDown'),
        pitchUp: keys.has('pitchUp'),
        pitchDown: keys.has('pitchDown'),
        flaps: false, // flaps toggles on the edge, read below
        drop: pressed.has('drop'),
        pause: pressed.has('pause'),
        mute: pressed.has('mute'),
        confirm: pressed.has('confirm'),
        back: pressed.has('back'),
      };
    },
    // Edge-triggered actions, consumed once per frame.
    consumeEdges() {
      const edges = {
        flaps: pressed.has('flaps'),
        drop: pressed.has('drop'),
        pause: pressed.has('pause'),
        mute: pressed.has('mute'),
        confirm: pressed.has('confirm'),
        back: pressed.has('back'),
      };
      pressed.clear();
      return edges;
    },
    // A click inside a rectangle, in canvas coordinates.
    clickedIn(x, y, w, h) {
      if (!mouse.clicked) return false;
      return mouse.clickX >= x && mouse.clickX <= x + w && mouse.clickY >= y && mouse.clickY <= y + h;
    },
    hoverIn(x, y, w, h) {
      return mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h;
    },
    endFrame() {
      mouse.clicked = false;
    },
  };
}
