import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { createCameraController } from './camera.js';
import { updateModel, loadModel, setBoundings} from './charaterMovement.js'
/**
 * creates a THREE.js scene which includes the terrain, buildings,
 * lighting, camera, and the player character model
 * @param {object} city  - An instance of the city object
 * @returns 
 */
export function createScene(city){

// Scene
const scene = new THREE.Scene();
const fogColor = 0xcdd8d9;
scene.background = new THREE.Color("white");
scene.fog = new THREE.Fog(fogColor, city.size * 0.9, city.size * 2.2);

// Renderer
const canvas = document.getElementById('bg')
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// sun is a vector3 that defines the position and direction of the light
const sun = new THREE.Vector3()


/**
 * Creates and positions the water plane in the scene 
 * A normal map texture is used to simulate waves
 */
function createWater(){
const waterGeometry = new THREE.PlaneGeometry(500, 500);
const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load('water.jpg', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xf8d9bd,
    waterColor: 0x0e87cc,
    distortionScale: 30.0,
});
water.rotation.x = -Math.PI / 2;  
water.position.y = -1.2;  
scene.add(water)
return water        
}



/**
 * Creates skyShader
 * Turbidity simulates haze and rayleigh controls how blue it looks
 */

function createSky(){
const sky = new Sky();
sky.scale.setScalar(500);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 2;       
skyUniforms['rayleigh'].value = 10;         
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

return sky
}

/**
 * Positions the sun vector and syncs it to the sky and water shaders
 * phi controls the elevation
 * theta controls the horizontal direction
 * @param {THREE.Vector3} sun 
 * @param {Sky} sky 
 * @param {Water} water 
 */
function updateSun(sun, sky, water){
const phi = THREE.MathUtils.degToRad(88);   
const theta = THREE.MathUtils.degToRad(180);
sun.setFromSphericalCoords(1, phi, theta);

sky.material.uniforms['sunPosition'].value.copy(sun);
water.material.uniforms['sunDirection'].value.copy(sun).normalize();
}

const water = createWater();
const sky = createSky();
updateSun(sun, sky, water);


/**
 * creates an array of lights, making it easier to access each light 
 */
function setupLights(){
    const ambient = new THREE.AmbientLight(0xaaaaaa, 3); 
    const dirLight = new THREE.DirectionalLight(0xfff4e0, 2)
    dirLight.position.copy(sun)
    dirLight.castShadow = true;
    scene.add(ambient, dirLight)


    return dirLight;

}
const  dirLight = setupLights();

const textureLoader = new THREE.TextureLoader();
/**
 * load ground textures gotten from: https://ambientcg.com/view?id=Grass005
 */

// ground textures
const groundColor = textureLoader.load("./grass/grassColor.png");
const groundDisplace = textureLoader.load("./grass/grassDisplacement.png");
const groundNormal = textureLoader.load("./grass/grassNormal.png");
const groundRough = textureLoader.load("./grass/grassRough.png");

groundColor.wrapS = groundColor.wrapT = THREE.RepeatWrapping;
groundDisplace.wrapS = groundDisplace.wrapT = THREE.RepeatWrapping;
groundNormal.wrapS = groundNormal.wrapT = THREE.RepeatWrapping;
groundRough.wrapS = groundRough.wrapT = THREE.RepeatWrapping;




/**
 * load building textures gotten from: https://ambientcg.com/view?id=Facade018A
 */

const buildingColor = textureLoader.load('./building/buildingColor.png');
const buildingRough = textureLoader.load('./building/buildingRough.png');
const buildingNormal = textureLoader.load('./building/buildingNormal.png');
const buildingMetal = textureLoader.load('./building/buildingMetal.png');
const buildingDisplace = textureLoader.load('./building/buildingDisplace.png');


buildingColor.wrapS = buildingColor.wrapT = THREE.RepeatWrapping;
buildingRough.wrapS = buildingRough.wrapT = THREE.RepeatWrapping;
buildingNormal.wrapS = buildingNormal.wrapT = THREE.RepeatWrapping;
buildingMetal.wrapS = buildingMetal.wrapT =  THREE.RepeatWrapping;
buildingDisplace.wrapS = buildingDisplace.wrapT =  THREE.RepeatWrapping;





// Ground tile materials - the top face uses ground texture
const materials = [
    { color: "green" },   
    { color: "green" },   
    { map: groundColor, displacementMap: groundDisplace, normalMap: groundNormal, roughnessMap: groundRough, displacementScale: 0.03 },     
    { color: "green" },   
    { color: "green" },   
    { color: "green" },   
].map(x => new THREE.MeshStandardMaterial(x));



let terrain = [];
let buildings = []
const sideMat = new THREE.MeshStandardMaterial({
                    map: buildingColor,
                    roughnessMap: buildingRough,
                    normalMap: buildingNormal,
                    metalnessMap: buildingMetal,
                    displacementMap: buildingDisplace,
                    displacementScale: 0.1
                })
const roofMat = new THREE.MeshStandardMaterial({color: 0x898989, roughness: 0.8, metalness: 0.0})
const buildingMat = [sideMat, sideMat, roofMat, sideMat, sideMat, sideMat]
/**
 * Initializes the city. Clears any existing terrain and buildings first.
 * City is centered around the origin using an offset
 * @param {object} city 
 */
function initcity(city){
    scene.remove(...terrain.flat(), ...buildings)
    terrain = []
    buildings = []
    const offset = city.size / 2
    for(let x = 0; x < city.size; x++){
        const col = []
        for (let y = 0; y < city.size; y++){
            const tile = city.data[x][y]

            const geo = new THREE.BoxGeometry(1,1,1);
            const cube = new THREE.Mesh(geo, materials);
            cube.position.set(x - offset, -0.5, y - offset);
            cube.receiveShadow = true
            scene.add(cube)
            col.push(cube)

            if(tile.type === 'road'){
                cube.material = new THREE.MeshLambertMaterial({color: 0X333333})
            }

            if(tile.type === 'building' && tile.buildingOrigin){

                buildingColor.repeat.set(tile.width, tile.height);
                buildingRough.repeat.set(tile.width, tile.height);
                buildingNormal.repeat.set(tile.width, tile.height);
                buildingMetal.repeat.set(tile.width, tile.height);

                const buildingGeo = new THREE.BoxGeometry(tile.width, tile.height, tile.depth);
                const building = new THREE.Mesh(buildingGeo, buildingMat);
                building.castShadow = true
                building.receiveShadow = true
                building.position.set(
                    x - offset + (tile.width - 1) / 2,
                    tile.height / 2,
                    y - offset + (tile.depth - 1) / 2
                );
                scene.add(building);
                buildings.push(building);
            }
        }
        terrain.push(col);
    }
}



let character
const cameraController = createCameraController(camera, city);
window.addEventListener("keydown", cameraController.onKeyDown);



const clock = new THREE.Clock()
/**
 * Async init — waits for the character model to load before
 * placing it in the world and binding camera controls.
 */
async function init(){
    character = await loadModel(scene);
    initcity(city);
    setBoundings(city.boundings)
     const offset = city.size / 2;
     const center = city.center
    character.position.set(center - offset, 0, center - offset);
    cameraController.setTarget(character);
}
init();


return {
    update(delta) {
        if (character) {
            updateModel(delta, city.size);
            cameraController.update(delta);
        }

        water.material.uniforms['time'].value += delta;
        renderer.render(scene, camera);
    }
};

}


