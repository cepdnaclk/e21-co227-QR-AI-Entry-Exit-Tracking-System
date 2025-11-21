import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, LogOut } from 'lucide-react';

// Props interface for ActionToggle component
interface ActionToggleProps {
  action: 'entry' | 'exit'; // Current selected action
  onActionChange: (action: 'entry' | 'exit') => void; // Callback to change the action
}

// ActionToggle component allows the user to choose between "entry" and "exit"
export const ActionToggle = ({ action, onActionChange }: ActionToggleProps) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      {/* Card header with title */}
      <CardHeader>
        <CardTitle>Action Type</CardTitle>
      </CardHeader>

      {/* Card content containing the two buttons */}
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {/* Entry button */}
          <Button
            variant={action === 'entry' ? 'default' : 'outline'} // Highlight if currently selected
            onClick={() => onActionChange('entry')} // Change action to 'entry' when clicked
            className="flex items-center gap-2" // Icon and text spacing
          >
            <LogIn className="w-4 h-4" /> {/* Entry icon */}
            Entry
          </Button>

          {/* Exit button */}
          <Button
            variant={action === 'exit' ? 'default' : 'outline'} // Highlight if currently selected
            onClick={() => onActionChange('exit')} // Change action to 'exit' when clicked
            className="flex items-center gap-2" // Icon and text spacing
          >
            <LogOut className="w-4 h-4" /> {/* Exit icon */}
            Exit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
