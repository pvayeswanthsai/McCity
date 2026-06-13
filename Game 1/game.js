// 1. Scene & Environment Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xff6b6b);
scene.fog = new THREE.FogExp2(0xff6b6b, 0.003); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false; 
document.body.appendChild(renderer.domElement);

document.addEventListener('click', () => {
    if (document.pointerLockElement !== document.body) document.body.requestPointerLock();
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffd700, 0.8);
sunLight.position.set(200, 400, -100);
scene.add(sunLight);

// ==========================================
// 2. Procedural Texture Generators
// ==========================================

function createAsphaltTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2c2c2c'; ctx.fillRect(0, 0, 256, 256);
    for(let i = 0; i < 4000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#222222' : '#353535';
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    ctx.fillStyle = '#ffcc00'; 
    for(let y = 0; y < 256; y += 30) { ctx.fillRect(125, y, 2, 15); ctx.fillRect(129, y, 2, 15); }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; return tex;
}

function createBuildingFacade() {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = Math.random() > 0.5 ? '#1a1a2e' : '#2d4263'; ctx.fillRect(0, 0, 128, 256);
    for(let x = 8; x < 128; x += 20) {
        for(let y = 8; y < 256; y += 25) {
            const lightOn = Math.random() > 0.6;
            ctx.fillStyle = lightOn ? (Math.random() > 0.8 ? '#ff007f' : '#00ffff') : '#0f0f1a';
            ctx.fillRect(x, y, 12, 18);
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; return tex;
}

function createSandTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#eaddaa'; ctx.fillRect(0, 0, 128, 128);
    for(let i=0; i<3000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#dcb98a' : '#f5e6c3';
        ctx.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; return tex;
}

function createGrassTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2d5a27'; ctx.fillRect(0, 0, 128, 128);
    for(let i=0; i<4000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#3b7a33' : '#1e401a';
        ctx.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; return tex;
}

// ==========================================
// 3. Entity Generators 
// ==========================================

function createHuman(isPlayer = false) {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshLambertMaterial({ color: '#e0ac69' });
    const pantsMat = new THREE.MeshLambertMaterial({ color: '#2c5a7a' });
    const shirtMat = new THREE.MeshLambertMaterial({ color: isPlayer ? '#00ffff' : '#ff007f' });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), shirtMat);
    torso.position.y = 2.3; group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), skinMat);
    head.position.y = 3.4; group.add(head);

    const legGeo = new THREE.BoxGeometry(0.5, 1.6, 0.5); legGeo.translate(0, -0.8, 0); 
    const leftLeg = new THREE.Mesh(legGeo, pantsMat); leftLeg.position.set(-0.35, 1.6, 0); group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat); rightLeg.position.set(0.35, 1.6, 0); group.add(rightLeg);

    const armGeo = new THREE.BoxGeometry(0.35, 1.4, 0.35); armGeo.translate(0, -0.7, 0);
    const leftArm = new THREE.Mesh(armGeo, skinMat); leftArm.position.set(-0.8, 3.0, 0); group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, skinMat); rightArm.position.set(0.8, 3.0, 0); group.add(rightArm);

    group.userData = { leftLeg, rightLeg, leftArm, rightArm, animationPhase: Math.random() * 100, isPunching: false, punchTimer: 0 };
    return group;
}

function createCarMesh(colorHex) {
    const carGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 8), new THREE.MeshLambertMaterial({ color: colorHex }));
    body.position.y = 0.75; carGroup.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 4), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    cabin.position.set(0, 1.8, -0.5); carGroup.add(cabin);

    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftLight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.2), lightMat); leftLight.position.set(-1.2, 0.8, -4.1);
    const rightLight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.2), lightMat); rightLight.position.set(1.2, 0.8, -4.1);
    carGroup.add(leftLight); carGroup.add(rightLight);

    return carGroup;
}

function createTrafficLight() {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 0.4), new THREE.MeshLambertMaterial({color: 0x444444}));
    pole.position.y = 5; group.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 0.4), new THREE.MeshLambertMaterial({color: 0x444444}));
    arm.position.set(3.5, 9, 0); group.add(arm);

    const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, 1.2), new THREE.MeshLambertMaterial({color: 0x111111}));
    box.position.set(6, 8.5, 0); group.add(box);

    const red = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.3), new THREE.MeshBasicMaterial({color: 0x440000}));
    red.position.set(6, 9.5, 0); group.add(red);
    const yellow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.3), new THREE.MeshBasicMaterial({color: 0x444400}));
    yellow.position.set(6, 8.5, 0); group.add(yellow);
    const green = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.3), new THREE.MeshBasicMaterial({color: 0x004400}));
    green.position.set(6, 7.5, 0); group.add(green);

    group.userData = { red, yellow, green };
    return group;
}

// ==========================================
// 4. World Generation
// ==========================================

const cityBlocks = 16;      
const blockSize = 60;       
const roadWidth = 30;       
const spacing = blockSize + roadWidth;
const mapBounds = (cityBlocks * spacing) / 2;
const beachStartX = (12 * spacing) - mapBounds; 

const buildingBoxes = []; 
const roadPaths = [];       
const navMesh = {}; 
const stoplights = [];

const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshLambertMaterial({ map: createAsphaltTexture() }));
ground.material.map.repeat.set(100, 100);
ground.rotation.x = -Math.PI / 2; 
scene.add(ground);

const sandTex = createSandTexture(); sandTex.repeat.set(15, 100);
const sand = new THREE.Mesh(new THREE.PlaneGeometry(300, 2000), new THREE.MeshLambertMaterial({ map: sandTex }));
sand.rotation.x = -Math.PI / 2; sand.position.set(beachStartX + 150, 0.1, 0); 
scene.add(sand);

const ocean = new THREE.Mesh(new THREE.PlaneGeometry(800, 2000), new THREE.MeshLambertMaterial({ color: 0x00aaff, transparent: true, opacity: 0.85 }));
ocean.rotation.x = -Math.PI / 2; ocean.position.set(beachStartX + 300 + 400, 0.05, 0); 
scene.add(ocean);

const barrier = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 2000), new THREE.MeshLambertMaterial({ color: 0x888888 }));
barrier.position.set(beachStartX, 1, 0); 
scene.add(barrier);
buildingBoxes.push(new THREE.Box3().setFromObject(barrier)); 

const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
const roofMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
const grassMat = new THREE.MeshLambertMaterial({ map: createGrassTexture() });
grassMat.map.repeat.set(2, 2);

const traffic = [];
const parkedCars = [];
const npcs = [];

function buildLivingCity() {
    const carColors = [0xff0055, 0x00ffcc, 0xffff00, 0xffffff, 0x222222, 0x0055ff];

    for (let x = 0; x < cityBlocks; x++) {
        if (x > 11) continue; 

        for (let z = 0; z < cityBlocks; z++) {
            const posX = (x * spacing) - mapBounds + spacing/2;
            const posZ = (z * spacing) - mapBounds + spacing/2;

            if (Math.abs(posX) < 40 && Math.abs(posZ) < 40) continue;

            const roadCoord = posX + (spacing / 2);
            if (!roadPaths.includes(roadCoord) && x < 11) roadPaths.push(roadCoord);

            const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(blockSize, 0.4, blockSize), sidewalkMat);
            sidewalk.position.set(posX, 0.2, posZ);
            scene.add(sidewalk);

            const lawn = new THREE.Mesh(new THREE.PlaneGeometry(blockSize - 6, blockSize - 6), grassMat);
            lawn.rotation.x = -Math.PI / 2;
            lawn.position.set(posX, 0.41, posZ);
            scene.add(lawn);

            const numBuildings = Math.floor(Math.random() * 3) + 1;
            
            for(let b = 0; b < numBuildings; b++) {
                const bWidth = Math.random() * 15 + 15;
                const bDepth = Math.random() * 15 + 15;
                const bHeight = Math.random() * 50 + (Math.sqrt(posX*posX + posZ*posZ) * 0.15) + 20;

                const facadeMat = new THREE.MeshLambertMaterial({ map: createBuildingFacade() });
                facadeMat.map.repeat.set(bWidth / 20, bHeight / 20);
                
                const building = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), [facadeMat, facadeMat, roofMat, roofMat, facadeMat, facadeMat]);
                building.position.set(posX + (Math.random() - 0.5) * (blockSize - bWidth - 4), bHeight / 2, posZ + (Math.random() - 0.5) * (blockSize - bDepth - 4));
                scene.add(building);
                
                buildingBoxes.push(new THREE.Box3().setFromObject(building)); 
            }

            const edge = 29; 
            const nw = { id: `c_${x}_${z}_NW`, x: posX - edge, z: posZ - edge, neighbors: [] };
            const ne = { id: `c_${x}_${z}_NE`, x: posX + edge, z: posZ - edge, neighbors: [] };
            const sw = { id: `c_${x}_${z}_SW`, x: posX - edge, z: posZ + edge, neighbors: [] };
            const se = { id: `c_${x}_${z}_SE`, x: posX + edge, z: posZ + edge, neighbors: [] };

            nw.neighbors.push(ne.id, sw.id); ne.neighbors.push(nw.id, se.id);
            sw.neighbors.push(nw.id, se.id); se.neighbors.push(ne.id, sw.id);
            navMesh[nw.id] = nw; navMesh[ne.id] = ne; navMesh[sw.id] = sw; navMesh[se.id] = se;

            if (x % 2 === 0 && z % 2 === 0) {
                const light = createTrafficLight();
                light.position.set(posX + 28, 0, posZ + 28);
                scene.add(light);
                stoplights.push(light);
            }

            if (Math.random() > 0.2) { 
                const pCar = { mesh: createCarMesh(carColors[Math.floor(Math.random() * carColors.length)]), speed: 0 };
                pCar.mesh.position.set(posX + (blockSize / 2) + 4, 0, posZ);
                scene.add(pCar.mesh); parkedCars.push(pCar);
            }

            spawnNPCsOnBlock(x, z);
        }
    }

    for (let x = 0; x <= 11; x++) {
        for (let z = 0; z < cityBlocks; z++) {
            const ne = navMesh[`c_${x}_${z}_NE`]; const nwRight = navMesh[`c_${x+1}_${z}_NW`];
            if (ne && nwRight) { ne.neighbors.push(nwRight.id); nwRight.neighbors.push(ne.id); }

            const se = navMesh[`c_${x}_${z}_SE`]; const swRight = navMesh[`c_${x+1}_${z}_SW`];
            if (se && swRight) { se.neighbors.push(swRight.id); swRight.neighbors.push(se.id); }

            const sw = navMesh[`c_${x}_${z}_SW`]; const nwBottom = navMesh[`c_${x}_${z+1}_NW`];
            if (sw && nwBottom) { sw.neighbors.push(nwBottom.id); nwBottom.neighbors.push(sw.id); }

            const se2 = navMesh[`c_${x}_${z}_SE`]; const neBottom = navMesh[`c_${x}_${z+1}_NE`];
            if (se2 && neBottom) { se2.neighbors.push(neBottom.id); neBottom.neighbors.push(se2.id); }
        }
    }
}

function spawnNPCsOnBlock(gridX, gridZ) {
    const corners = ['NW', 'NE', 'SW', 'SE'];
    for(let i = 0; i < 2; i++) {
        const corner = corners[Math.floor(Math.random() * corners.length)];
        const startNode = navMesh[`c_${gridX}_${gridZ}_${corner}`];
        if (!startNode) continue; 

        const npcMesh = createHuman(false); 
        npcMesh.position.set(startNode.x, 0, startNode.z);
        scene.add(npcMesh);

        npcs.push({ 
            mesh: npcMesh, 
            currentNodeId: startNode.id,
            targetNodeId: startNode.neighbors[Math.floor(Math.random() * startNode.neighbors.length)],
            prevNodeId: null,
            // REDUCED: NPCs wander at a much calmer pace
            speed: 0.02 + Math.random() * 0.02, 
            health: 100,
            state: 'wander' 
        });
    }
}

function spawnTraffic() {
    for (let i = 0; i < 15; i++) {
        const carMesh = createCarMesh(0x222222); 
        const isAxisX = Math.random() > 0.5;
        const laneOffset = Math.random() > 0.5 ? 7 : -7;
        const randomTrack = roadPaths[Math.floor(Math.random() * roadPaths.length)] + laneOffset;
        
        if (isAxisX) { 
            carMesh.position.set(randomTrack, 0, (Math.random() - 0.5) * mapBounds * 1.5); 
            carMesh.rotation.y = laneOffset > 0 ? 0 : Math.PI; 
        } else { 
            const startX = -mapBounds + Math.random() * (beachStartX + mapBounds - 20);
            carMesh.position.set(startX, 0, randomTrack); 
            carMesh.rotation.y = laneOffset > 0 ? Math.PI / 2 : -Math.PI / 2; 
        }

        scene.add(carMesh);
        // REDUCED: Traffic cars drive at a much safer, visible speed
        traffic.push({ mesh: carMesh, speed: 0.2 + Math.random() * 0.15, direction: isAxisX });
    }
}

buildLivingCity();
spawnTraffic();

// ==========================================
// 5. Player State & Logic
// ==========================================

const player = createHuman(true); 
player.position.set(0, 0, 0);
scene.add(player);

const playerBox = new THREE.Box3();
const keys = { w: false, a: false, s: false, d: false, space: false, arrowleft: false, arrowright: false };

let currentState = 'walking'; 
let activeVehicle = null;

const velocity = new THREE.Vector3();
// REDUCED: Player walking speed cut in half
const playerSpeed = 0.25;
const turnSpeed = 0.05;
const gravity = 0.03;
let isJumping = false;

let moneyCounter = 0;
const maxHealth = 200; 
let playerHealth = maxHealth;

function updateHUD() {
    document.querySelector('.money').innerText = `$${String(moneyCounter).padStart(8, '0')}`;
    document.querySelector('.health-fill').style.width = `${Math.max(0, (playerHealth / maxHealth) * 100)}%`;
}

function handlePlayerDamage(amount) {
    playerHealth -= amount;
    updateHUD();
    
    if (playerHealth <= 0) {
        playerHealth = maxHealth;
        moneyCounter = Math.max(0, moneyCounter - 150); 
        player.position.set(0, 0, 0); 
        if (currentState === 'driving') attemptVehicleToggle(); 
        npcs.forEach(npc => { if(npc.state === 'aggro') npc.state = 'wander'; });
        updateHUD();
    }
}

// REDUCED: Car speed and acceleration variables turned down
const maxCarSpeed = 0.7;
const carAcceleration = 0.01;
const carDeceleration = 0.005;
const carTurnSpeed = 0.03;

document.addEventListener('keydown', (e) => { 
    let k = e.key.toLowerCase(); if (k === ' ') k = 'space'; 
    if (keys.hasOwnProperty(k)) keys[k] = true; 
    if (k === 'f' || k === 'enter') attemptVehicleToggle();
});
document.addEventListener('keyup', (e) => { 
    let k = e.key.toLowerCase(); if (k === ' ') k = 'space'; 
    if (keys.hasOwnProperty(k)) keys[k] = false; 
});
document.addEventListener('mousedown', (e) => {
    if (e.button === 0 && currentState === 'walking' && document.pointerLockElement && !player.userData.isPunching) {
        player.userData.isPunching = true; player.userData.punchTimer = 20; 
        executePlayerPunch();
    }
});
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
});

// ==========================================
// 6. Interaction, Combat, & Collisions
// ==========================================

function executePlayerPunch() {
    const punchRange = 4.0;
    const playerForward = new THREE.Vector3(0, 0, -1).applyEuler(player.rotation).normalize();

    npcs.forEach(npc => {
        if (npc.state !== 'dead') {
            if (player.position.distanceTo(npc.mesh.position) < punchRange) {
                const dirToNPC = npc.mesh.position.clone().sub(player.position).normalize();
                if (dirToNPC.dot(playerForward) > 0.4) { 
                    npc.health -= 35; npc.state = 'aggro'; 
                    npc.mesh.position.addScaledVector(dirToNPC, 1.5);
                    if (npc.health <= 0) {
                        npc.state = 'dead'; npc.mesh.rotation.x = -Math.PI / 2; npc.mesh.position.y = 0.6; 
                        moneyCounter += Math.floor(Math.random() * 50) + 10; updateHUD();
                    }
                }
            }
        }
    });
}

function attemptVehicleToggle() {
    if (currentState === 'walking') {
        let nearestCar = null, minDistance = 12; 
        for (let car of parkedCars) {
            const dist = player.position.distanceTo(car.mesh.position);
            if (dist < minDistance) { minDistance = dist; nearestCar = car; }
        }
        if (nearestCar) {
            currentState = 'driving'; activeVehicle = nearestCar; player.visible = false; 
            document.querySelector('.weapon').innerText = 'DRIVING'; 
        }
    } else {
        currentState = 'walking';
        const ejectOffset = new THREE.Vector3(-6, 0, 0).applyMatrix4(new THREE.Matrix4().makeRotationY(activeVehicle.mesh.rotation.y));
        player.position.copy(activeVehicle.mesh.position).add(ejectOffset);
        player.position.y = 0; player.rotation.y = activeVehicle.mesh.rotation.y; player.visible = true; activeVehicle = null;
        document.querySelector('.weapon').innerText = 'FIST'; 
    }
}

// ==========================================
// 7. AI & Simulation Subroutines
// ==========================================

function animateLimbs(humanGroup, speedModifier) {
    const d = humanGroup.userData; d.animationPhase += speedModifier;
    const s = Math.sin(d.animationPhase) * 0.8;
    d.leftLeg.rotation.x = s; d.rightLeg.rotation.x = -s; d.leftArm.rotation.x = -s; d.rightArm.rotation.x = s;
}
function stopLimbs(humanGroup) {
    const d = humanGroup.userData; d.leftLeg.rotation.x = 0; d.rightLeg.rotation.x = 0;
    if (!d.isPunching) { d.leftArm.rotation.x = 0; d.rightArm.rotation.x = 0; }
}

function updateWorldSystems() {
    const cycle = (Date.now() / 1000) % 12; 
    let lightState = cycle < 5 ? 0 : (cycle < 7 ? 1 : 2); 
    
    stoplights.forEach(tl => {
        tl.userData.red.material.color.setHex(lightState === 2 ? 0xff0000 : 0x440000);
        tl.userData.yellow.material.color.setHex(lightState === 1 ? 0xffff00 : 0x444400);
        tl.userData.green.material.color.setHex(lightState === 0 ? 0x00ff00 : 0x004400);
    });

    ocean.position.y = 0.05 + Math.sin(Date.now() * 0.002) * 0.04; 

    npcs.forEach(npc => {
        if (npc.state === 'dead') return; 

        if (npc.state === 'aggro') {
            const dist = npc.mesh.position.distanceTo(player.position);
            
            if (dist > 2.5) {
                const dirX = player.position.x - npc.mesh.position.x; const dirZ = player.position.z - npc.mesh.position.z;
                const len = Math.sqrt(dirX*dirX + dirZ*dirZ);
                // Even angry running speed is reduced slightly
                npc.mesh.position.x += (dirX / len) * (npc.speed * 1.2); npc.mesh.position.z += (dirZ / len) * (npc.speed * 1.2);
                npc.mesh.rotation.y = Math.atan2(dirX, dirZ); animateLimbs(npc.mesh, 0.2);
            } else {
                stopLimbs(npc.mesh);
                if (!npc.mesh.userData.isPunching) {
                    npc.mesh.userData.isPunching = true; npc.mesh.userData.punchTimer = 20;
                    handlePlayerDamage(10);
                    player.position.addScaledVector(player.position.clone().sub(npc.mesh.position).normalize(), 1);
                }
            }
        } else if (npc.state === 'wander') {
            const targetNode = navMesh[npc.targetNodeId];
            if (targetNode) {
                const dirX = targetNode.x - npc.mesh.position.x; const dirZ = targetNode.z - npc.mesh.position.z;
                const distToTarget = Math.sqrt(dirX*dirX + dirZ*dirZ);

                if (distToTarget < 1.0) {
                    npc.prevNodeId = npc.currentNodeId; npc.currentNodeId = npc.targetNodeId;
                    const choices = navMesh[npc.currentNodeId].neighbors.filter(id => id !== npc.prevNodeId) || navMesh[npc.currentNodeId].neighbors;
                    npc.targetNodeId = choices[Math.floor(Math.random() * choices.length)];
                } else {
                    npc.mesh.position.x += (dirX / distToTarget) * npc.speed; npc.mesh.position.z += (dirZ / distToTarget) * npc.speed;
                    npc.mesh.rotation.y = Math.atan2(dirX, dirZ); animateLimbs(npc.mesh, 0.15);
                }
            }
        }

        if (npc.mesh.userData.isPunching) {
            npc.mesh.userData.punchTimer--;
            npc.mesh.userData.rightArm.rotation.x = Math.sin(npc.mesh.userData.punchTimer * 0.4) * -2;
            if (npc.mesh.userData.punchTimer <= 0) { npc.mesh.userData.isPunching = false; npc.mesh.userData.rightArm.rotation.x = 0; }
        }
    });

    traffic.forEach(car => {
        car.mesh.translateZ(-car.speed);
        
        if (car.mesh.position.x > beachStartX - 20) car.mesh.position.x = -mapBounds; 
        if (car.mesh.position.x < -mapBounds * 1.2) car.mesh.position.x = beachStartX - 20;
        if (car.mesh.position.z > mapBounds * 1.2) car.mesh.position.z = -mapBounds * 1.2;
        if (car.mesh.position.z < -mapBounds * 1.2) car.mesh.position.z = mapBounds * 1.2;

        const carBox = new THREE.Box3().setFromObject(car.mesh);

        if (currentState === 'walking' && playerBox.intersectsBox(carBox)) {
            player.position.addScaledVector(player.position.clone().sub(car.mesh.position).normalize(), 5); player.position.y += 2; 
            handlePlayerDamage(30); 
        }
    });
}

// ==========================================
// 8. Core Game Loop
// ==========================================

function animate() {
    requestAnimationFrame(animate);
    playerBox.setFromObject(player); 

    if (currentState === 'walking') {
        const prevPosition = player.position.clone();

        if (keys.a || keys.arrowleft) player.rotation.y += turnSpeed;
        if (keys.d || keys.arrowright) player.rotation.y -= turnSpeed;
        
        const moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
        velocity.z = moveZ * playerSpeed; player.translateZ(velocity.z);

        if (Math.abs(velocity.z) > 0) animateLimbs(player, 0.2); else stopLimbs(player); 

        if (player.userData.isPunching) {
            player.userData.punchTimer--; player.userData.rightArm.rotation.x = Math.sin(player.userData.punchTimer * 0.4) * -2;
            if (player.userData.punchTimer <= 0) { player.userData.isPunching = false; player.userData.rightArm.rotation.x = 0; }
        }

        if (keys.space && !isJumping) { velocity.y = 0.7; isJumping = true; }
        velocity.y -= gravity; player.position.y += velocity.y;
        if (player.position.y <= 0) { player.position.y = 0; velocity.y = 0; isJumping = false; }

        playerBox.setFromObject(player);
        let hitSolid = false;
        
        for (let b of buildingBoxes) { if (playerBox.intersectsBox(b)) { hitSolid = true; break; } }
        
        if (!hitSolid) {
            for (let npc of npcs) { if (npc.state !== 'dead' && playerBox.intersectsBox(new THREE.Box3().setFromObject(npc.mesh))) { hitSolid = true; break; } }
        }

        if (hitSolid) player.position.copy(prevPosition);

        const cameraOffset = new THREE.Vector3(0, 10, 20).applyMatrix4(new THREE.Matrix4().makeRotationY(player.rotation.y));
        const targetLookAt = player.position.clone(); targetLookAt.y += 3; 
        camera.position.copy(player.position).add(cameraOffset); camera.lookAt(targetLookAt);
        document.getElementById('player-blip').style.transform = `translate(-50%, -50%) rotate(${-player.rotation.y}rad)`;

    } else if (currentState === 'driving') {
        const prevCarPos = activeVehicle.mesh.position.clone();

        if (keys.w) activeVehicle.speed += carAcceleration; else if (keys.s) activeVehicle.speed -= carAcceleration; 
        else {
            if (activeVehicle.speed > 0) activeVehicle.speed = Math.max(0, activeVehicle.speed - carDeceleration);
            if (activeVehicle.speed < 0) activeVehicle.speed = Math.min(0, activeVehicle.speed + carDeceleration);
        }

        activeVehicle.speed = Math.max(-maxCarSpeed / 2, Math.min(maxCarSpeed, activeVehicle.speed));

        if (Math.abs(activeVehicle.speed) > 0.05) {
            const turnMult = activeVehicle.speed > 0 ? 1 : -1; 
            if (keys.a || keys.arrowleft) activeVehicle.mesh.rotation.y += carTurnSpeed * turnMult;
            if (keys.d || keys.arrowright) activeVehicle.mesh.rotation.y -= carTurnSpeed * turnMult;
        }

        activeVehicle.mesh.translateZ(-activeVehicle.speed);
        player.position.copy(activeVehicle.mesh.position); player.rotation.y = activeVehicle.mesh.rotation.y;

        const carBox = new THREE.Box3().setFromObject(activeVehicle.mesh);
        let crashed = false;

        for (let b of buildingBoxes) { if (carBox.intersectsBox(b)) { crashed = true; break; } }
        
        if (crashed) {
            activeVehicle.mesh.position.copy(prevCarPos); activeVehicle.speed = -activeVehicle.speed * 0.4; 
            handlePlayerDamage(5); 
        }

        const cameraOffset = new THREE.Vector3(0, 15, 30).applyMatrix4(new THREE.Matrix4().makeRotationY(activeVehicle.mesh.rotation.y));
        const targetLookAt = activeVehicle.mesh.position.clone(); targetLookAt.y += 2; 
        camera.position.copy(activeVehicle.mesh.position).add(cameraOffset); camera.lookAt(targetLookAt);
        document.getElementById('player-blip').style.transform = `translate(-50%, -50%) rotate(${-activeVehicle.mesh.rotation.y}rad)`;
    }

    updateWorldSystems();
    renderer.render(scene, camera);
}

animate();