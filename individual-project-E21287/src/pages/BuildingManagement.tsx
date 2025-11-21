import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 🔹 Component: BuildingManagement
//    - Handles listing, adding, editing, and deleting buildings
//    - Connects to backend APIs to manage building data
const BuildingManagement = () => {
  // React state variables
  const [buildings, setBuildings] = useState([]); // Stores all building data
  const [name, setName] = useState(""); // Stores input field value
  const [editingId, setEditingId] = useState<string | null>(null); // Tracks currently edited building ID (if any)
  
  // Base URL for backend API (empty means same origin)
  const API_BASE = "";

  // 🔹 Fetch building list from backend
  const fetchBuildings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/buildings`);
      console.log(" API Response:", res);
      setBuildings(res.data); // Update state with fetched data
    } catch (err) {
      console.error(" Error fetching buildings:", err);
    }
  };

  // Run fetchBuildings() when component loads
  useEffect(() => {
    fetchBuildings();
  }, []);

  // 🔹 Handle Add or Edit action
  const handleAddOrEdit = async () => {
    try {
      if (editingId) {
        // If editing, send PUT request to update building name
        await axios.put(`${API_BASE}/api/buildings/${editingId}`, { name });
        setEditingId(null); // Reset editing state
      } else {
        // Otherwise, create a new building
        await axios.post(`${API_BASE}/api/buildings`, { name });
      }
      setName(""); // Clear input field
      fetchBuildings(); // Refresh list
    } catch (err) {
      console.error("Error saving building:", err);
    }
  };

  // 🔹 Handle Delete action
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/api/buildings/${id}`);
      fetchBuildings(); // Refresh after delete
    } catch (err) {
      console.error("Error deleting building:", err);
    }
  };

  // 🔹 Handle Edit button click — load selected building into input field
  const handleEdit = (building: any) => {
    setEditingId(building.id);
    setName(building.name);
  };

  // 🔹 UI rendering
  return (
    <div className="p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Building Management</CardTitle>
          {/* Could add navigation button here if needed */}
          
          
        </CardHeader>

        <CardContent>
          {/* Input and Add/Update button */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter building name"
              value={name}
              onChange={(e) => setName(e.target.value)} // Update name state on input
            />
            <Button onClick={handleAddOrEdit}>
              {editingId ? "Update" : "Add"} {/* Toggle button label */}
            </Button>
          </div>

          {/* Display list of buildings */}
          <ul className="space-y-2">
            {buildings.map((b: any) => (
              <li
                key={b.id}
                className="flex justify-between items-center bg-gray-100 p-2 rounded"
              >
                <span>{b.name}</span>
                <div className="flex gap-2">
                  {/* Edit button */}
                  <Button variant="outline" onClick={() => handleEdit(b)}>
                    Edit
                  </Button>
                  {/* Delete button */}
                  <Button variant="destructive" onClick={() => handleDelete(b.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildingManagement;
