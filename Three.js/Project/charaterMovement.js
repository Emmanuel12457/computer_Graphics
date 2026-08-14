import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let mixer;
let model;
let origin;
let actions;
let currentAnimation = 'idle';  
let buildingBoxes = [];

const key = [0, 0];
const TURN_SPEED = 1.5;
const MOVE_SPEED = 1.8;

window.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'KeyW': key[0] = -1; break;
        case 'KeyS': key[0] =  1; break;
        case 'KeyD': key[1] = -1; break;
        case 'KeyA': key[1] =  1; break;
    }
});

window.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'KeyW': key[0] = key[0] < 0 ? 0 : key[0]; break;
        case 'KeyS': key[0] = key[0] > 0 ? 0 : key[0]; break;
        case 'KeyD': key[1] = key[1] < 0 ? 0 : key[1]; break;
        case 'KeyA': key[1] = key[1] > 0 ? 0 : key[1]; break;
    }
});

/**
 * Loads the character model and initializes all animation actions.
 * Centers the model at its feet and adds it to the scene.
 * @param {THREE.Scene} scene
 * @returns {Promise<THREE.Object3D>}
 */
export async function loadModel(scene) {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('AJ.glb');
    model = gltf.scene;
    origin = new THREE.Group();  

    model.scale.set(0.3, 0.3, 0.3);
    model.traverse((child) => {
        if(child.isMesh || child.isSkinnedMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;

    origin.add(model);
    scene.add(origin);

    mixer = new THREE.AnimationMixer(model);
    actions = {
        idle:    mixer.clipAction(gltf.animations[1]),
        running: mixer.clipAction(gltf.animations[3]),
    };

    for(const name in actions) {
        actions[name].enabled = true;
        actions[name].setEffectiveTimeScale(1);
        actions[name].setEffectiveWeight(0);
        actions[name].play();
    }
    actions.idle.setEffectiveWeight(1);

    return origin;
}

/**
 * pass in  the building meshes so we can check for collisions
 * @param {THREE.Mesh[]} boundings 
 */
export function setBoundings(boundings){
    buildingBoxes = boundings
}

/**
 * checks if the character's current position collides with any meshes 
 * or is outside the cityGrid bounds
 * @param {number} gridSize
 * @returns {boolean}
 */
function checkCollision(gridSize){
    const characterBox = new THREE.Box3().setFromObject(origin)
    const halfSize = (gridSize / 2) 

    if(
        origin.position.x < -halfSize ||
        origin.position.x > halfSize ||
        origin.position.z < -halfSize ||
        origin.position.z > halfSize
    ) return true

    for(const box of buildingBoxes){
        if(characterBox.intersectsBox(box)) return true
    }
    return false
    

}



/**
 * Advances the animation mixer, processes input, and moves the character.
 * @param {number} delta - elapsed time in seconds
 */
export function updateModel(delta, gridSize) {
    if(!mixer || !origin) return;

    const prevPosition = origin.position.clone();
    const prevRotation = origin.rotation.clone()


    // movement
    origin.rotation.y += key[1] * TURN_SPEED * delta;
    const forward = new THREE.Vector3(0, 0, 1).applyEuler(origin.rotation);
    origin.position.addScaledVector(forward, -key[0] * MOVE_SPEED * delta);  

    if(checkCollision(gridSize)){
        origin.position.copy(prevPosition)
        origin.rotation.copy(prevRotation)
    }

    // animation switching
    const active = key[0] !== 0 || key[1] !== 0;
    const newState = active ? 'running' : 'idle';
    if(newState !== currentAnimation) {
        setAnimation(newState);
    }

    mixer.update(delta);
}

/**
 * Sets the weight and time scale of an animation action
 * @param {THREE.AnimationAction} action
 * @param {number} weight
 */
function setWeight(action, weight) {
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
}

/**
 * Smoothly transitions to a new animation using crossfade
 * @param {string} name - 'idle', 'running', or 'jumping'
 */
function setAnimation(name) {  
    if(currentAnimation === name) return;
    const current = actions[name];
    const old = actions[currentAnimation];
    currentAnimation = name;
    setWeight(current, 1.0);
    old.fadeOut(0.3);
    current.reset().fadeIn(0.3).play();
}

