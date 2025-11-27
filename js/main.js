// Main UI logic and event handlers

let currentScreensaver = '3dtext'; // Track which screensaver is active

// Global FPS limiting for all screensavers
window.TARGET_FPS = 60;
window.FRAME_INTERVAL = 1000 / window.TARGET_FPS;

// Clock functionality
function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('clock').textContent = `${hours}:${minutes} ${ampm}`;
}

// Handle screensaver selection change
function onScreensaverChange() {
    const select = document.getElementById('screensaverSelect');
    currentScreensaver = select.value;
    console.log('Screensaver changed to:', currentScreensaver);
}

// Update preview settings for 3D Text
function updatePreview() {
    const spinStyle = document.getElementById('spinStyle').value;
    
    // Determine actual spin style (handle random)
    if (spinStyle === 'random') {
        const styles = ['none', 'see-saw', 'spin', 'wobble'];
        window.currentSpin = styles[Math.floor(Math.random() * styles.length)];
    } else {
        window.currentSpin = spinStyle;
    }
    
    // Update screensaver text (this recreates the mesh with new settings)
    if (window.screensaverInitialized && window.updateScreensaverText) {
        window.updateScreensaverText();
    }
}

// Update for live preview when adjusting settings
function updateLivePreview() {
    updatePreview();
    
    // If preview is currently showing, update it live
    if (document.getElementById('previewOverlay').classList.contains('active')) {
        if (window.screensaverInitialized && window.updateScreensaverText) {
            window.updateScreensaverText();
        }
    }
}

// Generate URL for OBS - 3D Text
function updateUrl() {
    const textInput = document.getElementById('textInput').value;
    const isText = document.getElementById('text').checked;
    const size = document.getElementById('sizeSlider').value;
    const speed = document.getElementById('speedSlider').value;
    const spinStyle = document.getElementById('spinStyle').value;
    const color = document.getElementById('colorPicker').value;
    const resolution = document.getElementById('resSlider').value;
    
    const isTextured = document.getElementById('textured').checked;
    
    console.log('=== updateUrl() Debug ===');
    console.log('isTextured:', isTextured);
    console.log('window.currentGradient:', window.currentGradient);
    
    const params = new URLSearchParams({
        text: isText ? (textInput || 'Goblinz Rule') : 'time',
        size: size,
        speed: speed,
        spin: spinStyle,
        color: color,
        resolution: resolution
    });
    
    if (isTextured && window.currentGradient) {
        params.set('gradient', window.currentGradient);
        console.log('✓ Added gradient to URL:', window.currentGradient);
    }
    
    const debugCheckbox = document.getElementById('password');
    if (debugCheckbox && debugCheckbox.checked) {
        params.set('debug', 'true');
    }
    
    const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
    const url = baseUrl + '3DText.html?' + params.toString();
    
    console.log('Generated URL:', url);
    
    document.getElementById('urlOutput').value = url;
}

// Generate URL for OBS - 3D Maze
function updateMazeUrl() {
    const mazeSize = document.getElementById('mazeSizeSlider').value;
    const wallTexture = window.currentMazeWallTexture || 'brick';
    const floorTexture = window.currentMazeFloorTexture || 'wood';
    const ceilingTexture = window.currentMazeCeilingTexture || 'ceiling';
    
    const params = new URLSearchParams({
        size: mazeSize,
        speed: 1, // Fixed speed for now
        wall: wallTexture,
        floor: floorTexture,
        ceiling: ceilingTexture
    });
    
    const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
    const url = baseUrl + '3DMaze.html?' + params.toString();
    
    console.log('Generated Maze URL:', url);
    
    document.getElementById('mazeUrlOutput').value = url;
}

// Maze texture selection
function selectMazeTexture(type) {
    console.log('Select texture for:', type);
    // For now, just cycle through some basic options
    // In a full implementation, this would open a texture selection window
    alert(`Texture selection for ${type} - coming soon! Using default for now.`);
}

// Copy URL to clipboard - 3D Text
function copyUrl() {
    const urlInput = document.getElementById('urlOutput');
    urlInput.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('copyUrlBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

// Copy URL to clipboard - 3D Maze
function copyMazeUrl() {
    const urlInput = document.getElementById('mazeUrlOutput');
    urlInput.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('copyMazeUrlBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

// Update maze size display
function updateMazeSizeDisplay() {
    const size = document.getElementById('mazeSizeSlider').value;
    document.getElementById('mazeSizeDisplay').textContent = `${size}x${size}`;
}

// Reset to defaults - 3D Text
function resetToDefaults() {
    document.getElementById('textInput').value = 'Goblinz Rule';
    document.getElementById('text').checked = true;
    document.getElementById('sizeSlider').value = 42;
    document.getElementById('speedSlider').value = 1.6;
    document.getElementById('resSlider').value = 250;
    document.getElementById('spinStyle').value = 'wobble';
    document.getElementById('colorPicker').value = '#ff6060';
    updatePreview();
}

// Reset to defaults - 3D Maze
function resetMazeDefaults() {
    document.getElementById('mazeSizeSlider').value = 20;
    document.getElementById('mazeOverlay').checked = false;
    document.getElementById('mazeFullScreen').checked = false;
    document.getElementById('mazeQualityDefault').checked = true;
    window.currentMazeWallTexture = 'brick';
    window.currentMazeFloorTexture = 'wood';
    window.currentMazeCeilingTexture = 'ceiling';
    updateMazeSizeDisplay();
    updateMazeUrl();
}

// Preview button handler
function handlePreview() {
    console.log('Preview button clicked, screensaver:', currentScreensaver);
    
    if (currentScreensaver === '3dtext') {
        updatePreview();
        document.getElementById('previewOverlay').classList.add('active');
        
        if (window.screensaverInitialized) {
            console.log('Starting 3D Text preview');
            window.resetScreensaverPosition();
            window.startScreensaverAnimation();
        } else {
            const checkInterval = setInterval(() => {
                if (window.screensaverInitialized) {
                    console.log('3D Text ready, starting animation');
                    clearInterval(checkInterval);
                    window.resetScreensaverPosition();
                    window.startScreensaverAnimation();
                }
            }, 100);
        }
    } else if (currentScreensaver === '3dmaze') {
        console.log('Starting 3D Maze preview');
        document.getElementById('previewOverlay').classList.add('active');
        
        // Initialize maze if not already done
        if (!window.mazeInitialized) {
            window.initMazeScene();
            window.mazeInitialized = true;
        }
        
        window.startMazeAnimation();
    }
}

// Close preview
function closePreview() {
    console.log('Closing preview, currentScreensaver:', currentScreensaver);
    document.getElementById('previewOverlay').classList.remove('active');
    
    if (currentScreensaver === '3dtext') {
        if (window.stopScreensaverAnimation) {
            window.stopScreensaverAnimation();
        }
    } else if (currentScreensaver === '3dmaze') {
        if (window.stopMazeAnimation) {
            window.stopMazeAnimation();
        }
    }
    
    // Clear the canvas
    const canvas = document.getElementById('canvas3d');
    if (canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (gl) {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
    }
}

// Clear canvas manually
function clearCanvas() {
    const canvas = document.getElementById('canvas3d');
    if (canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (gl) {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
    }
    console.log('Canvas cleared manually');
}

// Texture window management
let selectedGradient = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Display Properties window management
function openDisplayProperties() {
    const displayWindow = document.getElementById('displayPropertiesWindow');
    const textSetupWindow = document.getElementById('textSetupWindow');
    const mazeSetupWindow = document.getElementById('mazeSetupWindow');
    
    displayWindow.style.display = 'flex';
    displayWindow.classList.remove('inactive');
    
    if (textSetupWindow && textSetupWindow.style.display !== 'none') {
        textSetupWindow.classList.add('inactive');
    }
    if (mazeSetupWindow && mazeSetupWindow.style.display !== 'none') {
        mazeSetupWindow.classList.add('inactive');
    }
}

function closeDisplayProperties() {
    const displayWindow = document.getElementById('displayPropertiesWindow');
    const textSetupWindow = document.getElementById('textSetupWindow');
    const mazeSetupWindow = document.getElementById('mazeSetupWindow');
    
    if ((!textSetupWindow || textSetupWindow.style.display === 'none') &&
        (!mazeSetupWindow || mazeSetupWindow.style.display === 'none')) {
        displayWindow.style.display = 'none';
    }
}

function openSettings() {
    const displayWindow = document.getElementById('displayPropertiesWindow');
    
    console.log('Opening settings for:', currentScreensaver);
    
    // Show appropriate settings window
    if (currentScreensaver === '3dtext') {
        const textSetupWindow = document.getElementById('textSetupWindow');
        textSetupWindow.style.display = 'flex';
        textSetupWindow.classList.remove('inactive');
        
        document.getElementById('mazeSetupWindow').style.display = 'none';
    } else if (currentScreensaver === '3dmaze') {
        const mazeSetupWindow = document.getElementById('mazeSetupWindow');
        mazeSetupWindow.style.display = 'flex';
        mazeSetupWindow.classList.remove('inactive');
        
        document.getElementById('textSetupWindow').style.display = 'none';
        
        // Update maze URL
        updateMazeUrl();
    }
    
    displayWindow.classList.add('inactive');
    
    const displayPropsCloseBtn = document.getElementById('displayPropsCloseBtn');
    if (displayPropsCloseBtn) {
        displayPropsCloseBtn.style.opacity = '0.5';
        displayPropsCloseBtn.style.cursor = 'not-allowed';
        displayPropsCloseBtn.style.pointerEvents = 'none';
    }
}

function closeSettings() {
    const displayWindow = document.getElementById('displayPropertiesWindow');
    const textSetupWindow = document.getElementById('textSetupWindow');
    const mazeSetupWindow = document.getElementById('mazeSetupWindow');
    
    console.log('Closing settings window');
    
    textSetupWindow.style.display = 'none';
    mazeSetupWindow.style.display = 'none';
    
    displayWindow.classList.remove('inactive');
    
    const displayPropsCloseBtn = document.getElementById('displayPropsCloseBtn');
    if (displayPropsCloseBtn) {
        displayPropsCloseBtn.style.opacity = '1';
        displayPropsCloseBtn.style.cursor = 'pointer';
        displayPropsCloseBtn.style.pointerEvents = 'auto';
    }
}

// Make windows draggable
function makeWindowDraggable(windowElement, titleBarElement) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    
    titleBarElement.addEventListener('mousedown', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'IMG') {
            return;
        }
        
        if (windowElement.classList.contains('inactive')) {
            return;
        }
        
        isDragging = true;
        
        const rect = windowElement.getBoundingClientRect();
        initialX = e.clientX - rect.left;
        initialY = e.clientY - rect.top;
        
        titleBarElement.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        windowElement.style.left = currentX + 'px';
        windowElement.style.top = currentY + 'px';
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            titleBarElement.style.cursor = 'move';
        }
    });
}

// Opens Texture Window
function openTextureWindow() {
    console.log('Opening texture window');
    const textureWindow = document.getElementById('textureWindow');
    textureWindow.style.display = 'block';
    
    selectedGradient = null;
    document.querySelectorAll('input[name="gradientSelect"]').forEach(radio => {
        radio.checked = false;
    });
}

function closeTextureWindow() {
    console.log('Closing texture window');
    document.getElementById('textureWindow').style.display = 'none';
}

function selectGradient(gradientType) {
    console.log('Selected gradient:', gradientType);
    selectedGradient = gradientType;
}

function applyTexture() {
    console.log('Applying texture:', selectedGradient);
    if (selectedGradient) {
        document.getElementById('textured').checked = true;
        window.currentGradient = selectedGradient;
        updateLivePreview();
    }
    closeTextureWindow();
}

function cancelTexture() {
    console.log('Cancelled texture selection');
    closeTextureWindow();
}

// Make texture window draggable
function makeDraggable() {
    const titleBar = document.getElementById('textureWindowTitleBar');
    const textureWindow = document.getElementById('textureWindow');
    
    if (!titleBar || !textureWindow) return;
    
    titleBar.addEventListener('mousedown', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'IMG') return;
        
        isDragging = true;
        const rect = textureWindow.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        
        titleBar.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const newX = e.clientX - dragOffsetX;
        const newY = e.clientY - dragOffsetY;
        
        textureWindow.style.left = newX + 'px';
        textureWindow.style.top = newY + 'px';
        textureWindow.style.transform = 'none';
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            const titleBar = document.getElementById('textureWindowTitleBar');
            if (titleBar) titleBar.style.cursor = 'move';
        }
    });
}

// Make functions globally accessible
window.openTextureWindow = openTextureWindow;
window.closeTextureWindow = closeTextureWindow;
window.selectGradient = selectGradient;
window.applyTexture = applyTexture;
window.cancelTexture = cancelTexture;
window.onScreensaverChange = onScreensaverChange;
window.selectMazeTexture = selectMazeTexture;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    console.log('THREE.js available?', typeof THREE !== 'undefined');
    
    if (typeof THREE === 'undefined') {
        console.error('THREE.js failed to load!');
        document.body.innerHTML = '<div style="color: white; padding: 50px; font-size: 24px;">ERROR: THREE.js failed to load.</div>';
        return;
    }
    
    // Clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Initialize 3D Text screensaver on page load
    console.log('Initializing 3D Text screensaver...');
    initScreensaver();
    
    // Initialize URLs
    updateUrl();
    updateMazeUrl();
    
    // Initialize draggable windows
    makeDraggable();
    
    // 3D Text event listeners
    document.getElementById('textInput').addEventListener('input', updateLivePreview);
    document.getElementById('text').addEventListener('change', updateLivePreview);
    document.getElementById('time').addEventListener('change', updateLivePreview);
    document.getElementById('sizeSlider').addEventListener('input', updateLivePreview);
    document.getElementById('speedSlider').addEventListener('input', updatePreview);
    document.getElementById('resSlider').addEventListener('input', updateLivePreview);
    document.getElementById('spinStyle').addEventListener('change', updatePreview);
    document.getElementById('colorPicker').addEventListener('input', updateLivePreview);
    
    // 3D Maze event listeners
    document.getElementById('mazeSizeSlider').addEventListener('input', function() {
        updateMazeSizeDisplay();
        updateMazeUrl();
    });
    
    // Button event listeners
    document.getElementById('previewBtn').addEventListener('click', handlePreview);
    document.getElementById('cancelBtn').addEventListener('click', resetToDefaults);
    document.getElementById('okBtn').addEventListener('click', updateUrl);
    document.getElementById('copyUrlBtn').addEventListener('click', copyUrl);
    document.getElementById('mazeCancelBtn').addEventListener('click', resetMazeDefaults);
    document.getElementById('mazeOkBtn').addEventListener('click', updateMazeUrl);
    document.getElementById('copyMazeUrlBtn').addEventListener('click', copyMazeUrl);
    document.getElementById('previewOverlay').addEventListener('click', closePreview);
    
    // Texture button
    const textureBtn = document.getElementById('textureBtn');
    if (textureBtn) {
        textureBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openTextureWindow();
        });
    }
    
    // Solid/textured radio listeners
    const solidRadio = document.getElementById('solid');
    if (solidRadio) {
        solidRadio.addEventListener('change', function() {
            if (this.checked) {
                window.currentGradient = null;
            }
        });
    }
    
    // Debug mode toggle
    const passwordCheckbox = document.getElementById('password');
    if (passwordCheckbox) {
        passwordCheckbox.addEventListener('change', function() {
            window.debugMode = this.checked;  // For 3D Text
            window.mazeDebugMode = this.checked;  // For 3D Maze
            const fpsDisplay = document.getElementById('fps');
            if (fpsDisplay) {
                fpsDisplay.style.display = this.checked ? 'block' : 'none';
            }
        });
    }
    
    // Make functions globally accessible
    window.openDisplayProperties = openDisplayProperties;
    window.closeDisplayProperties = closeDisplayProperties;
    window.openSettings = openSettings;
    window.closeSettings = closeSettings;
    
    // Make windows draggable
    const displayWindow = document.getElementById('displayPropertiesWindow');
    const displayTitleBar = document.getElementById('displayPropsTitleBar');
    const textSetupWindow = document.getElementById('textSetupWindow');
    const textSetupTitleBar = document.getElementById('textSetupTitleBar');
    const mazeSetupWindow = document.getElementById('mazeSetupWindow');
    const mazeSetupTitleBar = document.getElementById('mazeSetupTitleBar');
    
    if (displayWindow && displayTitleBar) {
        makeWindowDraggable(displayWindow, displayTitleBar);
    }
    
    if (textSetupWindow && textSetupTitleBar) {
        makeWindowDraggable(textSetupWindow, textSetupTitleBar);
    }
    
    if (mazeSetupWindow && mazeSetupTitleBar) {
        makeWindowDraggable(mazeSetupWindow, mazeSetupTitleBar);
    }
    
    // Window activation handlers
    if (displayWindow) {
        displayWindow.addEventListener('mousedown', function() {
            const textSetup = document.getElementById('textSetupWindow');
            const mazeSetup = document.getElementById('mazeSetupWindow');
            if ((!textSetup || textSetup.style.display === 'none') &&
                (!mazeSetup || mazeSetup.style.display === 'none')) {
                this.classList.remove('inactive');
            }
        });
    }
    
    if (textSetupWindow) {
        textSetupWindow.addEventListener('mousedown', function() {
            this.classList.remove('inactive');
            if (displayWindow) {
                displayWindow.classList.add('inactive');
            }
        });
    }
    
    if (mazeSetupWindow) {
        mazeSetupWindow.addEventListener('mousedown', function() {
            this.classList.remove('inactive');
            if (displayWindow) {
                displayWindow.classList.add('inactive');
            }
        });
    }
});
