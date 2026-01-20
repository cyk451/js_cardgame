
class SceneManager {
    root = document.getElementById("scene-root");
    oroot = document.getElementById("overlay-root");
    stack = [];
    
  topscene() {
      return this.stack.length > 0? this.stack[this.stack.length - 1]: null;
  }
  
  showOverlay(overlay, data = null) {
    const el = overlay.createElement();
    this.oroot.appendChild(el);
  }
  
  push(scene, data = null) {
    this.stack.push(scene);
    console.log(scene);
    this.root.replaceChildren(scene.createElement());
    scene.enter(data);
  }

  pop() {
    this.stack.pop();
    const last = this.topscene();
    if (last != null) {
        this.root.replaceChildren(last.createElement());
        last.enter(data);
    }
  }
}

