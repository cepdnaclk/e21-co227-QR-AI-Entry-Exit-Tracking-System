// Import required hooks and components
import { useState, useEffect } from 'react';
import { QRScanner } from '@/components/QRScanner';              // Component that handles camera scanning
import { BuildingSelector } from '@/components/BuildingSelector';// Dropdown for selecting a building
import { ActionToggle } from '@/components/ActionToggle';        // Switch between 'entry' and 'exit' actions
import { ScanResult } from '@/components/ScanResult';            // Displays scan result info
import { Button } from '@/components/ui/button';                 // Shadcn UI Button
import { useToast } from '@/hooks/use-toast';                    // Custom toast notification hook
const uopLogo = '/lovable-uploads/f10da031-5557-4314-87a4-d1e1801714a1.png';  // Logo for University of Peradeniya
const engexLogo = '/lovable-uploads/c8de7f56-9b26-4a5d-823b-235879e3f037.png';// Logo for ENGEX exhibition
import { BarChart3 } from 'lucide-react';                        // Icon for buttons
import { useNavigate } from "react-router-dom";                  // Hook for page navigation


// Type definition for Building data fetched from backend
interface Building {
  id: string;
  name: string;
}

// Base API URL — empty means backend runs on same origin (good for local dev)
const API_BASE = "";


// ---------------- MAIN COMPONENT ----------------
export default function Scanner() {

  // React state variables
  const [buildings, setBuildings] = useState<Building[]>([]);  // Stores list of buildings
  const [selectedBuilding, setSelectedBuilding] = useState<string>(''); // Stores user-selected building ID
  const [action, setAction] = useState<'entry' | 'exit'>('entry');      // Stores selected action type
  const [scannerActive, setScannerActive] = useState(false);           // Controls camera on/off state
  const [scanResult, setScanResult] = useState<{                   // Stores last scanned QR details
    qrValue: string;
    timestamp: string;
    saved: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);    // Tracks API save operation
  const [loading, setLoading] = useState(true);   // Tracks initial loading state
  const { toast } = useToast();                   // Used to display notifications
  const navigate = useNavigate();                 // Used for page navigation
  const [scannerName, setScannerName] = useState(''); // Name of the person scanning

  // Load buildings from backend when page loads
  useEffect(() => {
    loadBuildings();
  }, []);

  // ---------------- FUNCTION: Load Buildings ----------------
  const loadBuildings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/buildings`);  // Fetch buildings from backend
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();

      // Normalize IDs (in case DB returns numbers)
      const normalized = (data as any[]).map(b => ({ id: String(b.id), name: b.name }));
      setBuildings(normalized);     // Save buildings list
      setLoading(false);            // Stop loading spinner
    } catch (error) {
      console.error(error);
      // Show error message using toast
      toast({ title: "Error", description: "Failed to load buildings", variant: "destructive" });
      setLoading(false);
    }
  };

  // ---------------- FUNCTION which Handle QR Scan ----------------
  const handleScan = async (qrValue: string) => {
    // Prevent scanning without selecting a building first
    if (!selectedBuilding) {
      toast({
        title: "No Building Selected",
        description: "Please select a building before scanning",
        variant: "destructive",
      });
      return;
    }

    // Record timestamp of the scan
    const timestamp = new Date().toLocaleString();

    // Display scan result on screen (not yet saved)
    setScanResult({
      qrValue,
      timestamp,
      saved: false,
    });

    // Turn off scanner after one scan
    setScannerActive(false);

    // Automatically send scan data to backend
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_value: qrValue,                      // Scanned value
          building_id: Number.parseInt(selectedBuilding), // Building ID
          action: action,                         // Entry or Exit
          timestamp: new Date().toISOString(),     // Current timestamp
        }),
      });

      if (!res.ok) throw new Error('Save failed');

      // Update scan result as "saved"
      setScanResult(prev => prev ? { ...prev, saved: true } : null);

      // Success toast
      toast({
        title: "Entry Saved",
        description: `${action} recorded successfully`,
      });
    } catch (error) {
      console.error('Error saving entry:', error);
      // Error toast if API fails
      toast({
        title: "Save Failed",
        description: "Failed to save entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false); // Stop loading animation on button
    }
  };


  // ---------------- FUNCTION: Clear Scan Result ----------------
  const handleClear = () => {
    setScanResult(null); // Clears last scanned data
  };

  // Find name of the currently selected building
  const selectedBuildingName = buildings.find(b => b.id === selectedBuilding)?.name || '';

  // ---------------- UI RENDER SECTION ----------------
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* ---------- Header Section ---------- */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-4">
            <img src={uopLogo} alt="University of Peradeniya" className="w-16 h-16" />
            <img src={engexLogo} alt="ENGEX Exhibition" className="w-16 h-16" />
          </div>
          <div>
            {/* Title with black outline using Tailwind text-shadow */}
            <h1 className="text-2xl font-bold text-white [text-shadow:_1px_1px_0_black,_-1px_1px_0_black,_1px_-1px_0_black,_-1px_-1px_0_black]">
              ENGEX Crowd Management
            </h1>
            <p className="text-muted-foreground">University of Peradeniya</p>
          </div>
        </div>

        {/* ---------- Navigation Buttons ---------- */}
        <div className="flex justify-center gap-4">
          {/* Button to go to Building Management page */}
          <Button
            variant="outline"
            onClick={() => navigate('/buildings')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Manage Buildings
          </Button>

          {/* Button to go to Counts page */}
          <Button
            variant="outline"
            onClick={() => navigate('/counts')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            View Counts
          </Button>
        </div>


        

        {/* ---------- Building Selector ---------- */}
        <BuildingSelector
          buildings={buildings}                     // Pass building list
          selectedBuilding={selectedBuilding}       // Current selection
          onBuildingChange={setSelectedBuilding}    // Update when changed
          loading={loading}                         // Disable while loading
        />


        


        {/* ---------- Action Toggle ---------- */}
        <ActionToggle
          action={action}                            // Current action (entry/exit)
          onActionChange={setAction}                 // Handle change
        />

        {/* ---------- QR Scanner ---------- */}
        <QRScanner
          onScan={handleScan}                        // Function to handle QR result
          isActive={scannerActive}                   // Controls camera visibility
          onToggle={() => setScannerActive(!scannerActive)} // Toggle camera
        />

        {/* ---------- Scan Result Display ---------- */}
        {scanResult && (
          <ScanResult
            qrValue={scanResult.qrValue}             // Scanned QR text
            building={selectedBuildingName}          // Building name
            action={action}                          // Entry/Exit
            timestamp={scanResult.timestamp}         // Scan time
            onSave={() => {}}                        // (Not used)
            onClear={handleClear}                    // Clear scan result
            saving={saving}                          // Disable buttons while saving
            saved={scanResult.saved}                 // Show if saved or not
          />
        )}
      </div>
    </div>
  );
}
