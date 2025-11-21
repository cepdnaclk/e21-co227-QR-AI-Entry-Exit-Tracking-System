// src/pages/CountsPage.tsx

// Import necessary React hooks and components
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { appendErrors } from "react-hook-form";

// Define a TypeScript interface to describe the shape of building count data
interface BuildingCount {
  id: number;              // Unique ID of the building
  name: string;            // Name of the building
  current_count: number;   // Number of people currently inside
}

// Base URL for API requests (empty means frontend and backend run on same domain)
const API_BASE = ""; // same as Scanner page

// Main React component for displaying building crowd counts
export default function CountsPage() {
  // useState hooks for managing data and loading state
  const [data, setData] = useState<BuildingCount[]>([]); // Stores list of buildings and counts
  const [loading, setLoading] = useState(true);          // Controls loading message visibility
  const [totalCount, setTotalCount] = useState<number>(0); // for total count across all buildings
  // useNavigate allows page navigation between routes
  const navigate = useNavigate();

  // useEffect runs once when the component is first rendered
  // It calls the function to load data from the backend
  useEffect(() => {
    loadCounts();
  }, []);

  // Function to fetch building counts from the backend API
  const loadCounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/counts`); // Call backend endpoint /api/counts
      if (!res.ok) throw new Error("Failed to load counts"); // Handle HTTP errors
      const json = await res.json();                        // Parse JSON response
      
      // If backend sends { buildings: [], total_count: X }
      setData(json.buildings || []);
      setTotalCount(json.total_count || 0);
      
    } catch (err) {
      console.error("Error loading counts:", err);          // Print error if fetch fails
    } finally {
      setLoading(false);                                    // Stop showing loading spinner
    }
  };

  return (
    <div className="min-h-screen p-6 bg-blue-1000"> {/* Page container with padding and background color */}
      <div className="max-w-lg mx-auto space-y-6">  {/* Centers content and adds vertical spacing */}
        
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray300">Building Crowd Counts</h1>
          <p className="text-gray-500">Live people count per building</p>
        </div>

        {/* Back Button to navigate to scanner page */}
        <Button variant="outline" onClick={() => navigate("/")}>
          ← Back to Scanner
        </Button>

        { (
          <div className="space-y-4">
            {/*  Total Count Card */}
            <div className="p-4 rounded-xl bg-white shadow flex justify-between items-center">
              <span className="font-medium text-gray-500">Total Count</span>
              <span className="text-2xl font-bold text-blue-900">{totalCount}</span>
            </div>

            {/* Individual Building Counts */}
            {data.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-white shadow flex justify-between items-center"
              >
                {/* Each card shows building name on the left and count on the right */}
                <span className="font-medium text-gray-500">{b.name}</span>
                <span className="text-xl font-bold text-blue-900">
                  {b.current_count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
