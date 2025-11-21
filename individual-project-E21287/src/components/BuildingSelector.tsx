import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building as BuildingIcon } from 'lucide-react';

interface Building {
  id: string;
  name: string;
}

interface BuildingSelectorProps {
  buildings: Building[];
  selectedBuilding: string;
  onBuildingChange: (buildingId: string) => void;
  loading?: boolean;
}

export const BuildingSelector = ({ 
  buildings, 
  selectedBuilding, 
  onBuildingChange, 
  loading = false 
}: BuildingSelectorProps) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BuildingIcon className="w-5 h-5" />
          Select Building
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select 
          value={selectedBuilding} 
          onValueChange={onBuildingChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full text-gray-50">
            <SelectValue placeholder={loading ? "Loading buildings..." : "Choose a building"} />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((building) => (
              <SelectItem key={building.id} value={building.id}>
                {building.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};