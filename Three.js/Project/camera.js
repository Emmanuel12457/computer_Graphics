import * as THREE from 'three';


/**
 * Minimal city data needed by the camera system.
 * @typedef {Object} CameraCity
 * @property {number} size - Tile width/height of the world.
 * @property {number} center - Center tile index used as spawn/world reference.
 */

/**
 * Camera controller API used by the scene loop.
 * @typedef {Object} CameraController
 * @property {(nextTarget: THREE.Object3D) => void} setTarget - Sets the tracked target.
 * @property {(event: KeyboardEvent) => void} onKeyDown - Handles keyboard camera mode changes.
 * @property {(delta: number) => void} update - Updates camera state every frame.
 */

/**
 * Smoothly zooms from current camera position into a close character view.
 * @param {THREE.Object3D} target - Object to frame and look at.
 * @param {THREE.PerspectiveCamera} camera - Active scene camera.
 * @param {number} [duration=1000] - Zoom duration in milliseconds.
 * @returns {void}
 */
export function createCharacterZoom(target, camera, duration = 1000) {
    const startcameraPos = camera.position.clone();
    const targetPos = target.position.clone().add(new THREE.Vector3(0, 1, 2)); 
    const startTime = performance.now();

    /**
     * Runs one step of the zoom interpolation until complete.
     * @returns {void}
     */
    function animateZoom() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    camera.position.lerpVectors(startcameraPos, targetPos, t);
    camera.lookAt(target.position);

    if (t < 1) {
        requestAnimationFrame(animateZoom);
    }

    }
    animateZoom()
}

/**
 * Creates a keyboard-driven camera controller with three modes:
 * `1` = character zoom, `2` = third-person follow, `3` = world pan.
 * @param {THREE.PerspectiveCamera} camera - Active scene camera.
 * @param {CameraCity} city - World dimensions used for world-pan framing.
 * @returns {CameraController}
 */
export function createCameraController(camera, city) {
    const cameraOffset = new THREE.Vector3(0, 1, -2);
    const cityOffset = city.size / 2;
    const worldCenter = new THREE.Vector3(city.center - cityOffset, 0, city.center - cityOffset);
    const worldViewRadius = city.size * 0.9;
    const worldViewHeight = city.size * 0.75;
    const worldPanSpeed = 0.3;

    let mode = "thirdPerson";
    let worldPanAngle = 0;
    let target = null;

    /**
     * Sets the object that follow and zoom modes should track.
     * @param {THREE.Object3D} nextTarget
     * @returns {void}
     */
    function setTarget(nextTarget) {
        target = nextTarget;
    }

    /**
     * Handles keyboard input to switch camera modes.
     * @param {KeyboardEvent} event
     * @returns {void}
     */
    function onKeyDown(event) {
        if (!target) return;

        if (event.key === "1") {
            mode = "zoom";
            createCharacterZoom(target, camera);
        }

        if (event.key === "2") {
            mode = "thirdPerson";
        }

        if (event.key === "3") {
            mode = "worldPan";
            const dx = camera.position.x - worldCenter.x;
            const dz = camera.position.z - worldCenter.z;
            if (dx !== 0 || dz !== 0) {
                worldPanAngle = Math.atan2(dz, dx);
            }
        }
    }

    /**
     * Advances camera behavior by one frame.
     * @param {number} delta - Elapsed frame time in seconds.
     * @returns {void}
     */
    function update(delta) {
        if (!target) return;

        if (mode === "thirdPerson") {
            const rotatedOffset = cameraOffset.clone().applyEuler(target.rotation);
            camera.position.copy(target.position).add(rotatedOffset);
            camera.lookAt(target.position);
        }

        if (mode === "worldPan") {
            worldPanAngle += delta * worldPanSpeed;
            const worldCameraPos = new THREE.Vector3(
                worldCenter.x + Math.cos(worldPanAngle) * worldViewRadius,
                worldViewHeight,
                worldCenter.z + Math.sin(worldPanAngle) * worldViewRadius
            );
            camera.position.lerp(worldCameraPos, 0.08);
            camera.lookAt(worldCenter);
        }
    }

    return {
        setTarget,
        onKeyDown,
        update
    };
}
