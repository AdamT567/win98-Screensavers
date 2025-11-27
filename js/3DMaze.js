// 3D Maze Screensaver using Three.js
// Inspired by the classic Windows 95/98 3D Maze screensaver
console.log('3DMaze.js is loading...');

// Debug mode
window.mazeDebugMode = false;

let mazeScene, mazeCamera, mazeRenderer;
let maze = [];
let mazeSize = 20; // 20x20 maze
let cellSize = 10;
let wallHeight = 5;

// Player position and movement
let playerX = 0;
let playerZ = 0;
let playerAngle = 0;
let moveSpeed = 0.08;
let turnSpeed = 0.03;
let mazeAnimationFrame = null;
let mazeLastFrameTime = 0;

// Navigation state
let isMoving = false;
let isTurning = false;
let targetAngle = 0;
let moveProgress = 0;
let currentDirection = 0; // 0: North, 1: East, 2: South, 3: West

// Start and end positions
let startX = 0;
let startZ = 0;
let endX = 0;
let endZ = 0;

// Texture settings
let wallTextureType = 'brick';
let floorTextureType = 'wood';
let ceilingTextureType = 'ceiling';

// Maze generation
function generateMaze(size) {
    console.log('Generating new maze with size:', size);
    // Initialize maze with all walls
    const m = [];
    for (let i = 0; i < size; i++) {
        m[i] = [];
        for (let j = 0; j < size; j++) {
            // [North, East, South, West] walls
            m[i][j] = [1, 1, 1, 1];
        }
    }
    
    // Recursive backtracking maze generation
    const stack = [];
    const visited = new Set();
    
    function cellKey(x, z) {
        return `${x},${z}`;
    }
    
    function getUnvisitedNeighbors(x, z) {
        const neighbors = [];
        const dirs = [
            { dx: 0, dz: -1, wall: 0, opposite: 2 }, // North
            { dx: 1, dz: 0, wall: 1, opposite: 3 },  // East
            { dx: 0, dz: 1, wall: 2, opposite: 0 },  // South
            { dx: -1, dz: 0, wall: 3, opposite: 1 }  // West
        ];
        
        for (const dir of dirs) {
            const nx = x + dir.dx;
            const nz = z + dir.dz;
            if (nx >= 0 && nx < size && nz >= 0 && nz < size && !visited.has(cellKey(nx, nz))) {
                neighbors.push({ x: nx, z: nz, wall: dir.wall, opposite: dir.opposite });
            }
        }
        
        return neighbors;
    }
    
    // Start from random cell - use current timestamp for better randomness
    const randomSeed = Date.now();
    let currentX = Math.floor(Math.random() * size);
    let currentZ = Math.floor(Math.random() * size);
    visited.add(cellKey(currentX, currentZ));
    stack.push({ x: currentX, z: currentZ });
    
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = getUnvisitedNeighbors(current.x, current.z);
        
        if (neighbors.length > 0) {
            // Choose random unvisited neighbor
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            // Remove walls between current and next
            m[current.z][current.x][next.wall] = 0;
            m[next.z][next.x][next.opposite] = 0;
            
            // Mark as visited and push to stack
            visited.add(cellKey(next.x, next.z));
            stack.push({ x: next.x, z: next.z });
        } else {
            // Backtrack
            stack.pop();
        }
    }
    
    console.log('Maze generated successfully');
    return m;
}

// Initialize Three.js scene for maze
function initMazeScene() {
    console.log('Initializing 3D Maze screensaver...');
    
    const canvas = document.getElementById('canvas3d');
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    
    // Clear any existing scene
    if (mazeScene) {
        while(mazeScene.children.length > 0) {
            mazeScene.remove(mazeScene.children[0]);
        }
    }
    
    // Scene
    mazeScene = new THREE.Scene();
    mazeScene.background = new THREE.Color(0x000000);
    mazeScene.fog = new THREE.Fog(0x000000, 0, cellSize * 5);
    
    // Camera - first person view
    mazeCamera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        cellSize * 10
    );
    mazeCamera.position.y = wallHeight / 2;
    
    // Renderer
    mazeRenderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: false // Keep it pixelated for authentic 90s feel
    });
    mazeRenderer.setSize(window.innerWidth, window.innerHeight);
    mazeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    mazeScene.add(ambientLight);
    
    // Directional light from camera
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mazeScene.add(dirLight);
    mazeCamera.add(dirLight);
    mazeScene.add(mazeCamera);
    
    // Generate and build maze
    console.log('Generating maze...');
    maze = generateMaze(mazeSize);
    
    // Set start and end positions
    startX = 0;
    startZ = 0;
    endX = mazeSize - 1;
    endZ = mazeSize - 1;
    
    buildMazeGeometry();
    
    // Find starting position (open cell)
    findStartPosition();
    
    console.log('Maze initialized successfully');
    
    // Handle window resize
    window.addEventListener('resize', onMazeWindowResize, false);
}

// Build the maze geometry
function buildMazeGeometry() {
    // Create textures
    const wallTexture = createBrickTexture();
    const floorTexture = createFloorTexture();
    const ceilingTexture = createCeilingTexture();
    
    // Materials
    const wallMaterial = new THREE.MeshPhongMaterial({
        map: wallTexture,
        side: THREE.DoubleSide
    });
    
    const floorMaterial = new THREE.MeshPhongMaterial({
        map: floorTexture,
        side: THREE.DoubleSide
    });
    
    const ceilingMaterial = new THREE.MeshPhongMaterial({
        map: ceilingTexture,
        side: THREE.DoubleSide
    });
    
    // Create marker materials
    const windowsLogoTexture = createWindowsLogoTexture();
    const smileyTexture = createSmileyTexture();
    const logoMaterial = new THREE.MeshBasicMaterial({ map: windowsLogoTexture, side: THREE.DoubleSide });
    const smileyMaterial = new THREE.MeshBasicMaterial({ map: smileyTexture, side: THREE.DoubleSide });
    
    // Build walls
    for (let z = 0; z < mazeSize; z++) {
        for (let x = 0; x < mazeSize; x++) {
            const cell = maze[z][x];
            const posX = (x - mazeSize / 2) * cellSize;
            const posZ = (z - mazeSize / 2) * cellSize;
            
            // North wall
            if (cell[0] === 1) {
                const geometry = new THREE.PlaneGeometry(cellSize, wallHeight);
                const wall = new THREE.Mesh(geometry, wallMaterial);
                wall.position.set(posX, wallHeight / 2, posZ - cellSize / 2);
                wall.rotation.y = 0;
                mazeScene.add(wall);
            }
            
            // East wall
            if (cell[1] === 1) {
                const geometry = new THREE.PlaneGeometry(cellSize, wallHeight);
                const wall = new THREE.Mesh(geometry, wallMaterial);
                wall.position.set(posX + cellSize / 2, wallHeight / 2, posZ);
                wall.rotation.y = Math.PI / 2;
                mazeScene.add(wall);
            }
            
            // South wall
            if (cell[2] === 1) {
                const geometry = new THREE.PlaneGeometry(cellSize, wallHeight);
                const wall = new THREE.Mesh(geometry, wallMaterial);
                wall.position.set(posX, wallHeight / 2, posZ + cellSize / 2);
                wall.rotation.y = Math.PI;
                mazeScene.add(wall);
            }
            
            // West wall
            if (cell[3] === 1) {
                const geometry = new THREE.PlaneGeometry(cellSize, wallHeight);
                const wall = new THREE.Mesh(geometry, wallMaterial);
                wall.position.set(posX - cellSize / 2, wallHeight / 2, posZ);
                wall.rotation.y = -Math.PI / 2;
                mazeScene.add(wall);
            }
            
            // Floor
            const floorGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(posX, 0, posZ);
            mazeScene.add(floor);
            
            // Add start marker (Windows logo)
            if (x === startX && z === startZ) {
                const logoGeometry = new THREE.PlaneGeometry(cellSize * 0.8, cellSize * 0.8);
                const logo = new THREE.Mesh(logoGeometry, logoMaterial);
                logo.rotation.x = -Math.PI / 2;
                logo.position.set(posX, 0.1, posZ);
                mazeScene.add(logo);
            }
            
            // Add end marker (Smiley face)
            if (x === endX && z === endZ) {
                const smileyGeometry = new THREE.PlaneGeometry(cellSize * 0.8, cellSize * 0.8);
                const smiley = new THREE.Mesh(smileyGeometry, smileyMaterial);
                smiley.rotation.x = -Math.PI / 2;
                smiley.position.set(posX, 0.1, posZ);
                mazeScene.add(smiley);
            }
            
            // Ceiling
            const ceilingGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
            const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
            ceiling.rotation.x = Math.PI / 2;
            ceiling.position.set(posX, wallHeight, posZ);
            mazeScene.add(ceiling);
        }
    }
}

// Create procedural textures
function createBrickTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Red brick pattern
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 128, 128);
    
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    
    // Draw brick pattern
    for (let y = 0; y < 128; y += 32) {
        for (let x = 0; x < 128; x += 64) {
            const offset = (y / 32) % 2 === 0 ? 0 : 32;
            ctx.strokeRect(x + offset, y, 64, 32);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Gray stone floor
    ctx.fillStyle = '#505050';
    ctx.fillRect(0, 0, 128, 128);
    
    // Add some texture variation
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 50 + 50}, ${Math.random() * 50 + 50}, ${Math.random() * 50 + 50}, 0.3)`;
        ctx.fillRect(Math.random() * 128, Math.random() * 128, Math.random() * 10 + 2, Math.random() * 10 + 2);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createCeilingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Dark ceiling
    ctx.fillStyle = '#303030';
    ctx.fillRect(0, 0, 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// Create Windows logo texture
function createWindowsLogoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 128, 128);
    
    // Draw Windows 95 logo (4 colored squares)
    const centerX = 64;
    const centerY = 64;
    const size = 25;
    const gap = 4;
    
    // Red (top-left)
    ctx.fillStyle = '#F00';
    ctx.fillRect(centerX - size - gap/2, centerY - size - gap/2, size, size);
    
    // Green (top-right)
    ctx.fillStyle = '#0F0';
    ctx.fillRect(centerX + gap/2, centerY - size - gap/2, size, size);
    
    // Blue (bottom-left)
    ctx.fillStyle = '#00F';
    ctx.fillRect(centerX - size - gap/2, centerY + gap/2, size, size);
    
    // Yellow (bottom-right)
    ctx.fillStyle = '#FF0';
    ctx.fillRect(centerX + gap/2, centerY + gap/2, size, size);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// Create smiley face texture
function createSmileyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Yellow circle
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(64, 64, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // Black outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(50, 50, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(78, 50, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Smile
    ctx.beginPath();
    ctx.arc(64, 64, 30, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.lineWidth = 3;
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// Find valid starting position
function findStartPosition() {
    // Start at the start marker position
    playerX = startX;
    playerZ = startZ;
    
    // Find first direction with no wall
    const cell = maze[startZ][startX];
    for (let dir = 0; dir < 4; dir++) {
        if (cell[dir] === 0) {
            currentDirection = dir;
            playerAngle = dir * Math.PI / 2;
            updateCameraPosition();
            return;
        }
    }
}

// Update camera position and rotation
function updateCameraPosition() {
    const worldX = (playerX - mazeSize / 2) * cellSize;
    const worldZ = (playerZ - mazeSize / 2) * cellSize;
    
    mazeCamera.position.x = worldX;
    mazeCamera.position.z = worldZ;
    mazeCamera.rotation.y = -playerAngle;
}

// Check if can move in direction
function canMove(x, z, direction) {
    if (x < 0 || x >= mazeSize || z < 0 || z >= mazeSize) return false;
    return maze[z][x][direction] === 0;
}

// Get next move using right-hand rule
function getNextMove() {
    const rightDir = (currentDirection + 1) % 4;
    const leftDir = (currentDirection + 3) % 4;
    const backDir = (currentDirection + 2) % 4;
    
    // Right-hand rule: keep your right hand on the wall
    // Priority: right > forward > left > back
    
    // 1. Try right - turn and move
    if (canMove(playerX, playerZ, rightDir)) {
        return { turn: rightDir, move: true };
    }
    
    // 2. Try forward - just move
    if (canMove(playerX, playerZ, currentDirection)) {
        return { turn: currentDirection, move: true };
    }
    
    // 3. Try left - turn and move
    if (canMove(playerX, playerZ, leftDir)) {
        return { turn: leftDir, move: true };
    }
    
    // 4. Dead end - turn around
    return { turn: backDir, move: false };
}

// Animation loop
function animateMaze() {
    mazeAnimationFrame = requestAnimationFrame(animateMaze);
    
    if (!mazeCamera || !mazeRenderer || !mazeScene) {
        console.warn('Maze components not ready');
        return;
    }

    const currentTime = performance.now();
    const deltaTime = currentTime - mazeLastFrameTime;
    
    if (deltaTime < window.FRAME_INTERVAL) {
        return;
    }
    
    mazeLastFrameTime = currentTime - (deltaTime % window.FRAME_INTERVAL);
    
    // FPS Counter (only if debug mode enabled)
    if (window.mazeDebugMode) {
        if (!window.mazeFrameCount) window.mazeFrameCount = 0;
        if (!window.mazeLastFpsTime) window.mazeLastFpsTime = performance.now();
        
        window.mazeFrameCount++;
        if (currentTime - window.mazeLastFpsTime >= 1000) {
            const fpsDisplay = document.getElementById('fps');
            if (fpsDisplay) {
                fpsDisplay.textContent = `FPS: ${window.mazeFrameCount}`;
                fpsDisplay.style.display = 'block';
            }
            window.mazeFrameCount = 0;
            window.mazeLastFpsTime = currentTime;
        }
    } else {
        const fpsDisplay = document.getElementById('fps');
        if (fpsDisplay) fpsDisplay.style.display = 'none';
    }
    
    // Handle turning
    if (isTurning) {
        const angleDiff = targetAngle - playerAngle;
        const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        
        if (Math.abs(normalizedDiff) < 0.05) {
            playerAngle = targetAngle;
            isTurning = false;
            currentDirection = Math.round(targetAngle / (Math.PI / 2)) % 4;
            if (currentDirection < 0) currentDirection += 4;
            updateCameraPosition();
            
            // After turning, try to move if path is clear
            if (canMove(playerX, playerZ, currentDirection)) {
                isMoving = true;
                moveProgress = 0;
            }
        } else {
            playerAngle += Math.sign(normalizedDiff) * turnSpeed;
            updateCameraPosition();
        }
    }
    // Handle moving
    else if (isMoving) {
        moveProgress += moveSpeed;
        
        if (moveProgress >= 1) {
            moveProgress = 0;
            isMoving = false;
            
            const dirs = [
                { dx: 0, dz: -1 },
                { dx: 1, dz: 0 },
                { dx: 0, dz: 1 },
                { dx: -1, dz: 0 }
            ];
            const dir = dirs[currentDirection];
            playerX += dir.dx;
            playerZ += dir.dz;
            
            updateCameraPosition();
            
            // Check if reached the end
            if (playerX === endX && playerZ === endZ) {
                console.log('Maze completed! Generating new maze...');
                stopMazeAnimation();
                setTimeout(() => {
                    initMazeScene();
                    startMazeAnimation();
                }, 1000);
            }
        } else {
            const dirs = [
                { dx: 0, dz: -1 },
                { dx: 1, dz: 0 },
                { dx: 0, dz: 1 },
                { dx: -1, dz: 0 }
            ];
            const dir = dirs[currentDirection];
            const startX = (playerX - mazeSize / 2) * cellSize;
            const startZ = (playerZ - mazeSize / 2) * cellSize;
            const targetX = startX + dir.dx * cellSize;
            const targetZ = startZ + dir.dz * cellSize;
            
            mazeCamera.position.x = startX + (targetX - startX) * moveProgress;
            mazeCamera.position.z = startZ + (targetZ - startZ) * moveProgress;
        }
    }
    // Get next move
    else {
        const nextMove = getNextMove();
        
        if (nextMove.turn !== currentDirection) {
            // Need to turn
            targetAngle = nextMove.turn * Math.PI / 2;
            isTurning = true;
        } else if (nextMove.move) {
            // Already facing correct direction, just move
            isMoving = true;
            moveProgress = 0;
        }
    }
    
    mazeRenderer.render(mazeScene, mazeCamera);
}

// Handle window resize
function onMazeWindowResize() {
    if (mazeCamera && mazeRenderer) {
        mazeCamera.aspect = window.innerWidth / window.innerHeight;
        mazeCamera.updateProjectionMatrix();
        mazeRenderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Start maze animation
function startMazeAnimation() {
    console.log('Starting maze animation...');
    if (mazeAnimationFrame) {
        cancelAnimationFrame(mazeAnimationFrame);
    }
    mazeLastFrameTime = performance.now();
    animateMaze();
}

// Stop maze animation
function stopMazeAnimation() {
    console.log('Stopping maze animation...');
    if (mazeAnimationFrame) {
        cancelAnimationFrame(mazeAnimationFrame);
        mazeAnimationFrame = null;
    }
}

// Export functions
window.initMazeScene = initMazeScene;
window.startMazeAnimation = startMazeAnimation;
window.stopMazeAnimation = stopMazeAnimation;

console.log('3DMaze.js exports complete');
