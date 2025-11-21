const API_BASE = "http://localhost:3000/api"; // Backend API base URL


//These lines store references to key HTML elements so JavaScript can access or update them.
const form = document.getElementById("scanForm"); // Scan submission form
const scanBody = document.getElementById("scanBody");  // Table body for displaying scans
const locationInput = document.getElementById("location");// Location input field
const directionInput = document.getElementById("direction"); //dropdown for direction


// Load saved location and previous scans on page load
window.onload = () => {
  const savedLocation = localStorage.getItem("scanner_location");
  if (savedLocation) {
    locationInput.value = savedLocation;
  }
  loadScans();
};

// Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();   //Prevents the form from refreshing the page (default browser behavior).


  //Reads the values entered in the input boxes.
  const tagId = document.getElementById("tagId").value.trim();
  const readerId = document.getElementById("readerId").value.trim();
  const location = locationInput.value.trim();
  const direction = directionInput.value.trim();



  // Basic validation of inputs
  if (!tagId || !location || !direction) {
    alert("Please enter Tag ID, Location, and Direction");
    return;
  }//pops up an alert if any of the fields are empty.

  // Saves the current location to the browser so next time it appears automatically
  localStorage.setItem("scanner_location", location);

  // Create JSON Data payload  (data object to send to the server)
  const payload = {
    tag_id: tagId,
    reader_id: readerId,
    location: location,
    direction: direction, 
  };

  try {
    const res = await fetch(`${API_BASE}/rfid-scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("Scan recorded successfully!");
      document.getElementById("tagId").value = "";
      loadScans();
    } else {
      alert("Failed to record scan.");
    }
  } catch (err) {
    console.error("Error submitting scan:", err); //runs if there's a problem in the backend connection.
    alert("Error while connecting to server.");
  }
});

// Load all previous scans
async function loadScans() {
  const res = await fetch(`${API_BASE}/rfid-scans`);  //Sends a GET request to /api/rfid-scans to get all scan records.
  const data = await res.json();  // Parses the JSON response and stores it in data.

  scanBody.innerHTML = ""; // Clears existing table rows.
  if (data.success && data.data.length > 0) {
    data.data.forEach((scan) => {   // create a table row for each scan record.
      const row = `<tr>
        <td>${scan.tag_id}</td>
        <td>${scan.location}</td>
        <td>${scan.direction || "-"}</td>
        <td>${new Date(scan.scan_time).toLocaleString()}</td>
      </tr>`;
      scanBody.innerHTML += row;
    });
  } else {
    scanBody.innerHTML = "<tr><td colspan='4'>No scans found.</td></tr>";
  }
}

// QR Scanner setup
let html5QrCode; //will hold the QR scanner instance.
const startScanBtn = document.getElementById("startScanBtn");  //the two scanner control buttons.
const stopScanBtn = document.getElementById("stopScanBtn");
const scanResult = document.getElementById("scanResult");

startScanBtn.addEventListener("click", async () => {
  html5QrCode = new Html5Qrcode("reader"); // Create QR code scanner instance
  const qrConfig = { fps: 5, qrbox: { width: 350, height: 350 } }; // better config
  startScanBtn.style.display = "none";
  stopScanBtn.style.display = "inline-block";
  scanResult.textContent = "Scanning...";

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      qrConfig,
      (decodedText) => {
        scanResult.textContent = `Scanned: ${decodedText}`;
        document.getElementById("tagId").value = decodedText; // auto-fill Tag ID
        html5QrCode.stop();
        stopScanBtn.style.display = "none";
        startScanBtn.style.display = "inline-block";
      },
      (errorMessage) => {
        console.warn("QR scan error:", errorMessage);
      }
    );
  } catch (err) {
    console.error("Unable to start scanning:", err);
    scanResult.textContent = "Camera access denied or not available.";
  }
});

stopScanBtn.addEventListener("click", () => {
  if (html5QrCode) {
    html5QrCode.stop();
    startScanBtn.style.display = "inline-block";
    stopScanBtn.style.display = "none";
    scanResult.textContent = "Scan stopped.";
  }
});
