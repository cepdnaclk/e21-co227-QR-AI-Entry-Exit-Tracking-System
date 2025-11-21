import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface ScanResultProps {
  qrValue: string;
  building: string;
  action: 'entry' | 'exit';
  timestamp: string;
  onSave: () => void;
  onClear: () => void;
  saving?: boolean;
  saved?: boolean;
}

export const ScanResult = ({ 
  qrValue, 
  building, 
  action, 
  timestamp, 
  onSave, 
  onClear, 
  saving = false, 
  saved = false 
}: ScanResultProps) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Scan Result
          {saved && <CheckCircle className="w-5 h-5 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">QR Code Value</label>
            <p className="font-mono text-sm bg-muted p-2 rounded break-all">{qrValue}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Building</label>
            <p className="font-medium">{building}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Action</label>
            <div>
              <Badge variant={action === 'entry' ? 'default' : 'secondary'}>
                {action.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
            <p className="text-sm flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {timestamp}
            </p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={onClear} 
            variant="outline"
            disabled={saving}
            className="px-8"
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};