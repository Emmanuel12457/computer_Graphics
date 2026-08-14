import * as THREE from 'three';
import { createScene } from "./scene.js";
import { createWorld } from "./world.js";

function createGame() {
    const overlay = document.getElementById("overlay");
    const startBtn = document.getElementById("startBtn");

    let city = null;
    let scene = null;
    let started = false;

    const clock = new THREE.Clock();

    startBtn.addEventListener("click", () => {

        overlay.style.transition = "opacity 0.2s";
        overlay.style.opacity = 0;

        setTimeout(() => {
            overlay.style.display = "none";
        }, 200);

        city = createWorld(50);
        scene = createScene(city);

        // enable controls if you added that hook
        if (scene.enableControls) {
            scene.enableControls();
        }

        started = true;
    });

    function loop() {
        requestAnimationFrame(loop);

        if (!started || !scene || !city) return;

        const delta = Math.min(clock.getDelta(), 0.1);

        city.update
        scene.update(delta);
    }

    loop();
}

createGame();

