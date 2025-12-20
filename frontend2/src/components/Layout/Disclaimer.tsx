import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';

export const Disclaimer: React.FC = () => {
  return (
    <Alert className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Medical Disclaimer</AlertTitle>
      <AlertDescription>
        This AI assistant provides general health information for educational purposes only. 
        It is NOT a substitute for professional medical advice, diagnosis, or treatment. 
        Always consult a qualified healthcare provider for medical decisions. 
        In case of emergency, call 911 or seek immediate medical attention.
      </AlertDescription>
    </Alert>
  );
};