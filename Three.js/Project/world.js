import * as THREE from 'three'

/**
 * Builds a grid-based city layout with roads, buildings, and a spawn point.
 * @param {number} size - Number of tiles along one side of the square world.
 * @returns {{size: number, data: Array<Array<object>>, center: number}}
 */
export function createWorld(size){
    const data = []
    for(let x =  0; x <  size; x ++){
        const col = []
         for (let y = 0; y < size; y++) {
            const tile = {
                x, y, 
                type: "empty",
                height: 0,
                width: 1,
                depth: 1,
                buildingOrigin: false
             };
             if(x %  7 < 2 || y % 7 < 2) {
                tile.type = 'road';
             }
             col.push(tile);
         }
         data.push(col)

}
const center = Math.floor(size / 2);
data[center][center].type = 'spawnPoint';
const blocks =  defineBlocks(data, size)
placeBuildings(blocks, data)


const offset = size / 2;
const boundings = []
for(let x = 0; x < size; x++){
    for(let y = 0; y < size; y ++){
        const tile = data[x][y]
        if(tile.type === 'building' && tile.buildingOrigin){
            const box = new THREE.Box3(
                new THREE.Vector3(
                    x - offset + (tile.width - 1 ) / 2  - tile.width / 2,
                    0,
                    y - offset + (tile.depth -1)/ 2  - tile.depth / 2
                ), 
                new THREE.Vector3(x - offset + (tile.width - 1) / 2 + tile.width / 2,
                tile.height,
                y - offset + (tile.depth - 1 ) / 2 + tile.depth / 2
            )
            );
            boundings.push(box)
        }
    }
}
return { size, data, center,boundings};
}


/**
 * Groups non-road, non-spawn tiles into 7x7 city blocks for building placement.
 * @param {Array<Array<object>>} data - World tile grid.
 * @param {number} size - Grid size.
 * @returns {Array<{blockX: number, blockY: number, tiles: Array<object>}>}
 */
function defineBlocks(data, size){
    const blocks  = {}
    for(let x = 0; x < size; x++){
        for(let y = 0; y < size; y ++){
            const tile = data[x][y];
            if (tile.type === 'road')
                continue;
            if (tile.type === 'spawnPoint')
                continue;

            const blockX = Math.floor(x/7);
            const blockY = Math.floor(y/7)
            const key =  `${blockX}, ${blockY}`;

            if (!blocks[key]){
                blocks[key] = {
                    blockX,blockY, tiles:[]
                };
            }
            blocks[key].tiles.push(tile)
        }
    }

    return Object.values(blocks);
}

/**
 * Fills each block with randomly sized rectangular building footprints.
 * Every tile in a footprint is marked as `building`; only the first tile is
 * marked as `buildingOrigin` so rendering can create one mesh per footprint.
 * @param {Array<{tiles: Array<object>}>} blocks - Candidate tile groups.
 * @param {Array<Array<object>>} data - World tile grid to change
 * @returns {void}
 */
function placeBuildings(blocks, data){
    const MaxAttempts  = 7;
    const maxWidth = 3;
    const maxDepth = 3;
    const maxHeight = 3;

    blocks.forEach(block => {
        const occupied = new Set();

        for(let attempt = 0; attempt < MaxAttempts; attempt++){
            const buildOrigin = block.tiles[Math.floor(Math.random() * block.tiles.length)];
            const width = Math.floor(Math.random() * maxWidth) + 1;
            const depth = Math.floor(Math.random() * maxDepth + 1);
            const height = Math.floor(Math.random() * maxHeight) + 1;

            const toOccupy  = [];
            let fits = true;

            for(let dx = 0;  dx < width; dx++){
                for(let dy = 0; dy < depth; dy ++){
                    const newX = buildOrigin.x + dx;
                    const newY = buildOrigin.y + dy;
                    const key = `${newX}, ${newY}`;
                    const tile = data[newX]?.[newY]

                    if(!tile || tile.type === "road" || tile.type === "spawnPoint" || occupied.has(key)){
                        fits = false;
                        break
                    }
                    toOccupy.push({key, newX, newY});
                }
                if(!fits) break;
            }
            if(fits){
                toOccupy.forEach(({key, newX, newY}, i) => {
                    occupied.add(key);
                    data[newX][newY].type = 'building';
                    data[newX][newY].width = width
                    data[newX][newY].depth = depth
                    data[newX][newY].height= height
                    data[newX][newY].buildingOrigin = i === 0
                })
            }
        }
    })

}
