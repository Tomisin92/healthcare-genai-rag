import React from 'react';
import { Activity, Menu } from 'lucide-react';
import { Button } from '../ui/button';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuClick}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Healthcare RAG Assistant</h1>
            <p className="text-xs text-muted-foreground">AI-powered medical information</p>
          </div>
        </div>
      </div>
    </header>
  );
};