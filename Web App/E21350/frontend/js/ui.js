// Set up UI event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('UI.js: DOMContentLoaded fired');
    const buildingSelect = document.getElementById('building-select');
    const directionInBtn = document.getElementById('btn-direction-in');
    const directionOutBtn = document.getElementById('btn-direction-out');
    const manualCountInput = document.getElementById('manual-count');
    const manualSubmitBtn = document.getElementById('btn-manual-submit');
    const buildingList = document.getElementById('building-list');
    const currentModeDisplay = document.getElementById('current-mode');
    
    // Verify DOM elements
    if (!buildingList) console.error('UI.js: building-list element not found');
    if (!currentModeDisplay) console.error('UI.js: current-mode element not found');
    
    // Set initial direction
    currentDirection = 'IN';
    updateModeDisplay();
    
    // Update current building when selection changes
    buildingSelect.addEventListener('change', (e) => {
        currentBuildingId = e.target.value;
        console.log('Building selected via dropdown:', currentBuildingId);
        highlightSelectedBuilding();
        showResult(`Selected building: ${e.target.value}`, 'success');
    });
    
    // Building list click handler (for mobile touch)
    buildingList.addEventListener('click', (e) => {
        const buildingItem = e.target.closest('.building-item');
        if (buildingItem) {
            currentBuildingId = buildingItem.dataset.buildingId;
            console.log('Building item clicked:', currentBuildingId);
            buildingSelect.value = currentBuildingId;
            highlightSelectedBuilding();
            showResult(`Selected building: ${currentBuildingId}`, 'success');
        }
    });
    
    // Direction button handlers
    directionInBtn.addEventListener('click', () => {
        setDirection('IN');
    });
    
    directionOutBtn.addEventListener('click', () => {
        setDirection('OUT');
    });
    
    // Manual submission handler
    manualSubmitBtn.addEventListener('click', () => {
        const count = manualCountInput.value.trim();
        
        if (count && Number.isInteger(Number(count)) && Number(count) > 0) {
            console.log('Submitting count:', count);
            processCount(Number(count));
            manualCountInput.value = ''; // Clear input
        } else {
            showResult('Error: Please enter a valid positive number of people', 'error');
        }
    });
    
    // Allow Enter key to submit manual entry
    manualCountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed for manual count');
            manualSubmitBtn.click();
        }
    });
    
    // Add touch feedback to buttons and summary
    const interactiveElements = document.querySelectorAll('button, summary');
    interactiveElements.forEach(el => {
        el.addEventListener('touchstart', function() {
            this.classList.add('active');
            console.log('Touched:', this.tagName, this.id || this.textContent);
        });
        el.addEventListener('touchend', function() {
            this.classList.remove('active');
        });
    });
    
    // Ensure Building Occupancy section is open on mobile
    if (isMobileDevice()) {
        const buildingDetails = buildingList.closest('details');
        if (buildingDetails && !buildingDetails.hasAttribute('open')) {
            buildingDetails.setAttribute('open', '');
            console.log('Forced Building Occupancy section open on mobile');
        }
    }
    
    // Prevent zoom on select dropdown (iOS fix)
    buildingSelect.addEventListener('touchstart', function(e) {
        if (window.innerWidth <= 480) {
            e.preventDefault();
            this.focus();
            if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                setTimeout(() => this.click(), 10);
            }
        }
    }, { passive: false });
    
    // Improve mobile dropdown experience
    buildingSelect.addEventListener('change', function() {
        if (window.innerWidth <= 480) {
            this.blur();
        }
    });

    // Update mode display
    function updateModeDisplay() {
        if (currentModeDisplay) {
            currentModeDisplay.textContent = `Mode: ${currentDirection === 'IN' ? 'Entry' : 'Exit'}`;
            currentModeDisplay.className = 'scan-result';
            currentModeDisplay.classList.add(currentDirection === 'IN' ? 'success' : 'warning');
            console.log('Mode updated:', currentDirection);
        }
    }

    // Highlight selected building
    function highlightSelectedBuilding() {
        const items = buildingList.querySelectorAll('.building-item');
        items.forEach(item => {
            item.classList.toggle('selected', item.dataset.buildingId === currentBuildingId);
        });
    }
});

// Set the current direction
function setDirection(direction) {
    const directionInBtn = document.getElementById('btn-direction-in');
    const directionOutBtn = document.getElementById('btn-direction-out');
    const currentModeDisplay = document.getElementById('current-mode');
    
    currentDirection = direction;
    
    if (direction === 'IN') {
        directionInBtn.classList.add('active');
        directionOutBtn.classList.remove('active');
        directionInBtn.setAttribute('aria-pressed', 'true');
        directionOutBtn.setAttribute('aria-pressed', 'false');
        showResult('Mode: Entry', 'success');
    } else {
        directionInBtn.classList.remove('active');
        directionOutBtn.classList.add('active');
        directionInBtn.setAttribute('aria-pressed', 'false');
        directionOutBtn.setAttribute('aria-pressed', 'true');
        showResult('Mode: Exit', 'success');
    }

    if (currentModeDisplay) {
        currentModeDisplay.textContent = `Mode: ${direction === 'IN' ? 'Entry' : 'Exit'}`;
        currentModeDisplay.className = 'scan-result';
        currentModeDisplay.classList.add(direction === 'IN' ? 'success' : 'warning');
        console.log('Mode set:', direction);
    }
}

// Add PWA features
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered:', registration))
            .catch(error => console.log('SW registration failed:', error));
    });
}

// Handle mobile app-like behavior
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('PWA install prompt deferred');
});

// Mobile-specific optimizations
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    document.body.classList.add('is-mobile');
    
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        select.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
            console.log('Select touched:', this.id);
        });
        select.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        });
    });
}

function isMobileDevice() {
    return (typeof window.orientation !== 'undefined') || 
           (navigator.userAgent.indexOf('IEMobile') !== -1) ||
           (navigator.userAgent.indexOf('Android') !== -1) ||
           (navigator.userAgent.indexOf('iPhone') !== -1) ||
           (navigator.userAgent.indexOf('iPad') !== -1) ||
           (navigator.userAgent.indexOf('iPod') !== -1);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('UI.js: Mobile check');
    if (isMobileDevice()) {
        console.log('Mobile device detected');
        document.body.classList.add('is-mobile');
        const buildingSelect = document.getElementById('building-select');
        if (buildingSelect) {
            buildingSelect.style.opacity = '1';
            buildingSelect.style.visibility = 'visible';
            console.log('Building select ensured visible');
        }
    }
});