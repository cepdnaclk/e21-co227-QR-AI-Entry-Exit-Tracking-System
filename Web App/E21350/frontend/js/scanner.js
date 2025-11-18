// Scanner variables
let html5QrcodeScanner = null;
let isScannerActive = false;
let lastScan = { tagId: null, timestamp: 0 }; // Track last scanned tagId and time
const DEBOUNCE_TIME = 30 * 1000; // 30 seconds in milliseconds

// Initialize the QR scanner
function initScanner() {
    const scannerElement = document.getElementById('qr-reader');
    const toggleButton = document.getElementById('btn-toggle-scanner');
    const cameraError = document.getElementById('camera-error');
    
    // Check if browser supports camera
    if (!isCameraSupported()) {
        toggleButton.disabled = true;
        toggleButton.textContent = 'Camera not supported';
        cameraError.style.display = 'block';
        return;
    }
    
    // Set up toggle scanner button
    toggleButton.addEventListener('click', toggleScanner);
}

// Check if camera is supported
function isCameraSupported() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.Html5QrcodeScanner);
}

// Toggle scanner on/off
async function toggleScanner() {
    const scannerElement = document.getElementById('qr-reader');
    const toggleButton = document.getElementById('btn-toggle-scanner');
    
    if (!isScannerActive) {
        // Start scanner
        try {
            // Create scanner instance
            html5QrcodeScanner = new Html5QrcodeScanner(
                "qr-reader", 
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
                },
                /* verbose= */ false
            );
            
            // Render scanner
            html5QrcodeScanner.render(
                onScanSuccess, 
                onScanFailure
            );
            
            scannerElement.style.display = 'block';
            toggleButton.textContent = 'Stop Scanner';
            toggleButton.classList.add('btn-out');
            toggleButton.classList.remove('btn-primary');
            isScannerActive = true;
            
        } catch (error) {
            console.error('Error starting scanner:', error);
            showResult('Error: Could not access camera. Check permissions.', 'error');
            toggleButton.textContent = 'Start Scanner';
            isScannerActive = false;
        }
    } else {
        // Stop scanner
        if (html5QrcodeScanner) {
            try {
                await html5QrcodeScanner.clear();
                html5QrcodeScanner = null;
                lastScan = { tagId: null, timestamp: 0 }; // Reset last scan on stop
            } catch (error) {
                console.error('Error stopping scanner:', error);
            }
        }
        
        scannerElement.style.display = 'none';
        toggleButton.textContent = 'Start Scanner';
        toggleButton.classList.remove('btn-out');
        toggleButton.classList.add('btn-primary');
        isScannerActive = false;
    }
}

// Handle successful scan
function onScanSuccess(decodedText, decodedResult) {
    // Only process numeric values (person IDs)
    const tagId = decodedText.trim();
    
    // Validate that it's a numeric value
    if (!/^\d+$/.test(tagId)) {
        showResult('Error: QR code should contain only numbers (person ID)', 'error');
        return;
    }
    
    // Check for duplicate scan within 30 seconds
    const currentTime = Date.now();
    if (lastScan.tagId === tagId && currentTime - lastScan.timestamp < DEBOUNCE_TIME) {
        console.log(`Duplicate scan ignored for tagId ${tagId}`);
        return; // Skip processing
    }
    
    // Update last scan
    lastScan = { tagId, timestamp: currentTime };
    
    // Add visual feedback
    const scannerElement = document.getElementById('qr-reader');
    scannerElement.classList.add('scan-success');
    setTimeout(() => {
        scannerElement.classList.remove('scan-success');
    }, 1000);
    
    // Process the scan
    processScan(parseInt(tagId));
}

// Handle scan failure
function onScanFailure(error) {
    // Mostly ignored as this gets called often
}

// Initialize scanner when page loads
document.addEventListener('DOMContentLoaded', initScanner);