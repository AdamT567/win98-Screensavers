// WebGL 3D Text Screensaver using Three.js

let scene, camera, renderer, textMesh, font;
let x = 0, y = 0, z = 0;
let velocityX = 2, velocityY = 1.5, velocityZ = 1;
let wobbleRotation = { x: 0, y: 0, z: 0 };
let seesawAngle = 0;
let animationId = null;
let lastFrameTime = 0;

const BASE_SPEED = 1;

window.screensaverInitialized = false;
window.currentSpin = 'wobble';
window.debugMode = false; // Add debug flag

// Initialize Three.js scene
function initScreensaver() {
    console.log('Starting screensaver initialization...');
    
    const canvas = document.getElementById('canvas3d');
    
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.z = 100;
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Lighting setup - Classic 3-point lighting for that 90s look
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(5, 10, 10);
    scene.add(keyLight);
    
    const fillLight = new THREE.DirectionalLight(0x8080ff, 0.4);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.6);
    backLight.position.set(0, -10, -10);
    scene.add(backLight);
    
    console.log('Scene, camera, renderer, and lights initialized');
    
    // Load font and create text
    const loader = new THREE.FontLoader();
    console.log('Loading font...');
    loader.load(
        'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
        function(loadedFont) {
            console.log('Font loaded successfully!');
            font = loadedFont;
            createText();
            window.screensaverInitialized = true;
            console.log('Screensaver fully initialized and ready');
        },
        function(progress) {
            if (progress.total > 0) {
                console.log('Loading font:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
            }
        },
        function(error) {
            console.error('Error loading font:', error);
        }
    );
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

// Create 3D extruded text
function createText() {
    console.log('Creating text mesh...');
    
    // Remove existing text mesh
    if (textMesh) {
        scene.remove(textMesh);
        if (textMesh.geometry) {
            textMesh.geometry.dispose();
        }
        if (textMesh.material) {
            if (Array.isArray(textMesh.material)) {
                textMesh.material.forEach(mat => mat.dispose());
            } else {
                textMesh.material.dispose();
            }
        }
        textMesh = null;
    }
    
    if (!font || !scene) {
        console.warn('Font or scene not ready');
        return;
    }
    
    // Get text settings
    const textInput = document.getElementById('textInput').value;
    const isText = document.getElementById('text').checked;
    const size = parseInt(document.getElementById('sizeSlider').value) / 10;
    const resolution = parseInt(document.getElementById('resSlider').value);
    const colorPicker = document.getElementById('colorPicker').value;
    
    let displayText;
    if (isText) {
        displayText = textInput || 'Goblinz Rule';
    } else {
        const now = new Date();
        displayText = now.toLocaleTimeString();
    }
    
    console.log('Creating text:', displayText, 'size:', size);
    
    // Calculate extrusion depth based on resolution slider
    const extrusionDepth = size * (0.1 + (resolution / 500) * 3);
    
    // Create extruded text geometry - this gives the authentic Windows 95/98 look!
    const textGeometry = new THREE.TextGeometry(displayText, {
        font: font,
        size: size,
        height: extrusionDepth,        // Extrusion depth controlled by resolution slider
        curveSegments: 12,             // Smoothness of curves
        bevelEnabled: true,            // Enable beveling for rounded edges
        bevelThickness: size * 0.05,   // Bevel depth
        bevelSize: size * 0.03,        // Bevel width
        bevelOffset: 0,
        bevelSegments: 5               // Bevel smoothness
    });
    
    // Compute bounding box for collision detection
    textGeometry.computeBoundingBox();
    
    // Center the geometry
    textGeometry.center();
    
// Check if using gradient or solid color
const isTextured = document.getElementById('textured').checked;
let materials;

if (isTextured && window.currentGradient) {
    // Use vertex colors for gradients (UV mapping doesn't work well on TextGeometry)
    const bbox = textGeometry.boundingBox;
    const textHeight = bbox.max.y - bbox.min.y;
    const minY = bbox.min.y;
    
    // Get gradient colors
    let colorStops;
    switch(window.currentGradient) {
        case 'rainbow':
            colorStops = [
                { stop: 0, color: new THREE.Color('#E40303') },    // Red - top
                { stop: 0.2, color: new THREE.Color('#FF8C00') },  // Orange
                { stop: 0.4, color: new THREE.Color('#FFED00') },  // Yellow
                { stop: 0.6, color: new THREE.Color('#008026') },  // Green
                { stop: 0.8, color: new THREE.Color('#24408E') },  // Blue
                { stop: 1, color: new THREE.Color('#732982') }     // Purple - bottom
            ];
            break;
        case 'trans':
            colorStops = [
                { stop: 0, color: new THREE.Color('#5BCEFA') },
                { stop: 0.25, color: new THREE.Color('#F5A9B8') },
                { stop: 0.5, color: new THREE.Color('#FFFFFF') },
                { stop: 0.75, color: new THREE.Color('#F5A9B8') },
                { stop: 1, color: new THREE.Color('#5BCEFA') }
            ];
            break;
        case 'bisexual':
            colorStops = [
                { stop: 0, color: new THREE.Color('#D60270') },
                { stop: 0.4, color: new THREE.Color('#D60270') },
                { stop: 0.5, color: new THREE.Color('#9B4F96') },
                { stop: 0.6, color: new THREE.Color('#0038A8') },
                { stop: 1, color: new THREE.Color('#0038A8') }
            ];
            break;
        case 'asexual':
            colorStops = [
                { stop: 0, color: new THREE.Color('#000000') },
                { stop: 0.25, color: new THREE.Color('#A3A3A3') },
                { stop: 0.5, color: new THREE.Color('#FFFFFF') },
                { stop: 0.75, color: new THREE.Color('#800080') },
                { stop: 1, color: new THREE.Color('#800080') }
            ];
            break;
        case 'pansexual':
            colorStops = [
                { stop: 0, color: new THREE.Color('#FF218C') },
                { stop: 0.33, color: new THREE.Color('#FF218C') },
                { stop: 0.33, color: new THREE.Color('#FFD800') },
                { stop: 0.66, color: new THREE.Color('#FFD800') },
                { stop: 0.66, color: new THREE.Color('#21B1FF') },
                { stop: 1, color: new THREE.Color('#21B1FF') }
            ];
            break;
        case 'lesbian':
            colorStops = [
                { stop: 0, color: new THREE.Color('#D62900') },
                { stop: 0.25, color: new THREE.Color('#FF9B55') },
                { stop: 0.5, color: new THREE.Color('#FFFFFF') },
                { stop: 0.75, color: new THREE.Color('#D462A6') },
                { stop: 1, color: new THREE.Color('#A40062') }
            ];
            break;
        case 'gay':
            colorStops = [
                { stop: 0, color: new THREE.Color('#078D70') },
                { stop: 0.2, color: new THREE.Color('#26CEAA') },
                { stop: 0.4, color: new THREE.Color('#98E8C1') },
                { stop: 0.6, color: new THREE.Color('#7BADE2') },
                { stop: 0.8, color: new THREE.Color('#5049CC') },
                { stop: 1, color: new THREE.Color('#3D1A78') }
            ];
            break;
    }
    
    // Apply vertex colors based on Y position
    const colors = [];
    const positions = textGeometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        // Normalize Y position from 0 (bottom) to 1 (top)
        const normalizedY = 1 - ((y - minY) / textHeight); // Invert so 0=top, 1=bottom
        
        // Find the appropriate color based on gradient stops
        let color;
        if (normalizedY <= colorStops[0].stop) {
            color = colorStops[0].color.clone();
        } else if (normalizedY >= colorStops[colorStops.length - 1].stop) {
            color = colorStops[colorStops.length - 1].color.clone();
        } else {
            // Find the two stops to interpolate between
            for (let j = 0; j < colorStops.length - 1; j++) {
                if (normalizedY >= colorStops[j].stop && normalizedY <= colorStops[j + 1].stop) {
                    const t = (normalizedY - colorStops[j].stop) / (colorStops[j + 1].stop - colorStops[j].stop);
                    color = colorStops[j].color.clone().lerp(colorStops[j + 1].color, t);
                    break;
                }
            }
        }
        
        colors.push(color.r, color.g, color.b);
    }
    
    textGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    materials = new THREE.MeshPhongMaterial({
        vertexColors: true,
        shininess: 100,
        specular: 0x444444
    });
} else {
    // Solid color materials
    const frontColor = new THREE.Color(colorPicker);
    const sideColor = new THREE.Color(colorPicker).multiplyScalar(0.5);
    
    materials = [
        new THREE.MeshPhongMaterial({ 
            color: frontColor,
            shininess: 100,
            specular: 0x444444
        }),
        new THREE.MeshPhongMaterial({ 
            color: sideColor,
            shininess: 30 
        })
    ];
}
    
    // Create mesh
    textMesh = new THREE.Mesh(textGeometry, materials);
    scene.add(textMesh);
    
    console.log('Text mesh created successfully:', textMesh);
    console.log('textMesh.position:', textMesh.position);
}

// Animation loop
function animateScreensaver() {
    const overlay = document.getElementById('previewOverlay');
    
    if (!overlay || !overlay.classList.contains('active')) {
        return;
    }
    
    // Safety check - wait for everything to be ready
    if (!textMesh || !textMesh.position || !renderer || !scene || !camera) {
        animationId = requestAnimationFrame(animateScreensaver);
        return;
    }

    // Speedslider multipliers are in Index.html under slider-container
    const speedSlider = document.getElementById('speedSlider');
    if (!speedSlider) {
        animationId = requestAnimationFrame(animateScreensaver);
        return;
    }

    // FPS limiting
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;
    
    if (deltaTime < FRAME_INTERVAL) {
        animationId = requestAnimationFrame(animateScreensaver);
        return;
    }
    
    lastFrameTime = currentTime - (deltaTime % FRAME_INTERVAL);
    
    // FPS Counter (only if debug mode enabled)
    if (window.debugMode) {
        if (!window.frameCount) window.frameCount = 0;
        if (!window.lastFpsTime) window.lastFpsTime = performance.now();
        
        window.frameCount++;
        if (currentTime - window.lastFpsTime >= 1000) {
            const fpsDisplay = document.getElementById('fps');
            if (fpsDisplay) {
                fpsDisplay.textContent = `FPS: ${window.frameCount}`;
                fpsDisplay.style.display = 'block';
            }
            window.frameCount = 0;
            window.lastFpsTime = currentTime;
        }
    } else {
        const fpsDisplay = document.getElementById('fps');
        if (fpsDisplay) fpsDisplay.style.display = 'none';
    }
    
    const speedMultiplier = parseFloat(speedSlider.value);

    // Update position - CONSTANT SPEED (not affected by slider)
    x += velocityX * BASE_SPEED;
    y += velocityY * BASE_SPEED;
    
    // Calculate actual visible bounds at Z=0
    const distance = camera.position.z; // Fixed distance since z=0
    const vFOV = camera.fov * Math.PI / 180;
    const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
    const visibleWidth = visibleHeight * camera.aspect;
    
    // Get text bounding box dimensions including depth
    let textDiagonal = 0;
    if (textMesh && textMesh.geometry && textMesh.geometry.boundingBox) {
        const bbox = textMesh.geometry.boundingBox;
        const textWidth = (bbox.max.x - bbox.min.x) / 2;
        const textHeight = (bbox.max.y - bbox.min.y) / 2;
        const textDepth = (bbox.max.z - bbox.min.z) / 2;
        
        // Calculate 3D diagonal (worst case when rotated in any direction)
        textDiagonal = Math.sqrt(textWidth * textWidth + textHeight * textHeight + textDepth * textDepth);
    }
    
    // Use bounds minus diagonal (accounts for rotation and depth)
    const boundsX = (visibleWidth / 2) - textDiagonal;
    const boundsY = (visibleHeight / 2) - textDiagonal;
    
    if (x > boundsX || x < -boundsX) {
        velocityX = -velocityX;
        x = Math.max(-boundsX, Math.min(boundsX, x));
    }
    
    if (y > boundsY || y < -boundsY) {
        velocityY = -velocityY;
        y = Math.max(-boundsY, Math.min(boundsY, y));
    }
    
    // Apply position - Z is always 0
    if (textMesh && textMesh.position) {
        textMesh.position.set(x, y, 0);
    } else {
        return;
    }
    
    // Apply rotation based on spin style
    if (window.currentSpin === 'wobble') {
        wobbleRotation.x += 0.015 * speedMultiplier;
        wobbleRotation.y += 0.02 * speedMultiplier;
        wobbleRotation.z += 0.015 * speedMultiplier;
        
        textMesh.rotation.x = Math.sin(wobbleRotation.x) * 0.3;
        textMesh.rotation.y = Math.sin(wobbleRotation.y) * 1.0;
        textMesh.rotation.z = Math.sin(wobbleRotation.z) * 0.3;
    } else if (window.currentSpin === 'spin') {
        // Continuous Y-axis rotation only
        textMesh.rotation.y += 0.02 * speedMultiplier;
        textMesh.rotation.x = 0;
        textMesh.rotation.z = 0;
    } else if (window.currentSpin === 'see-saw') {
    // Rocks back and forth on Z axis only
    seesawAngle += 0.05 * speedMultiplier;
    textMesh.rotation.z = Math.sin(seesawAngle) * 0.5;
    textMesh.rotation.x = 0;
    textMesh.rotation.y = 0;
    } else if (window.currentSpin === 'none') {
        // No rotation at all
        textMesh.rotation.x = 0;
        textMesh.rotation.y = 0;
        textMesh.rotation.z = 0;
    }
    
    // Update time display if showing time
    if (document.getElementById('time').checked) {
        const now = new Date();
        const seconds = now.getSeconds();
        if (seconds !== (window.lastSecond || 0)) {
            window.lastSecond = seconds;
            createText();
        }
    }
    
    // Render the scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
    
    // Continue animation loop
    animationId = requestAnimationFrame(animateScreensaver);
}

// Handle window resize
function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Reset position and velocity
function resetScreensaverPosition() {
    x = (Math.random() - 0.5) * 60;
    y = (Math.random() - 0.5) * 40;
    z = 0;
    
    const angle = Math.random() * Math.PI * 2;
    velocityX = Math.cos(angle) * .5; // ← This controls speed
    velocityY = Math.sin(angle) * .5; // ← This controls speed
    velocityZ = 0;
    
    wobbleRotation = { x: 0, y: 0, z: 0 };
    seesawAngle = 0;
}

// Start animation
function startScreensaverAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    animateScreensaver();
}

// Stop animation
function stopScreensaverAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// Update text (called from main.js)
function updateScreensaverText() {
    if (font) {
        createText();
    }
}

// Export functions and variables to window object
window.initScreensaver = initScreensaver;
window.startScreensaverAnimation = startScreensaverAnimation;
window.stopScreensaverAnimation = stopScreensaverAnimation;
window.resetScreensaverPosition = resetScreensaverPosition;
window.updateScreensaverText = updateScreensaverText;

// Export textMesh reference for debugging
Object.defineProperty(window, 'textMesh', {
    get: function() { return textMesh; }
});
