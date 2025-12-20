import React, { useState } from 'react';
import { SourceDocument } from '../../types/chat';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';

interface SourceDocumentsProps {
  documents: SourceDocument[];
}

export const SourceDocuments: React.FC<SourceDocumentsProps> = ({ documents }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!documents || documents.length === 0) return null;

  return (
    <div className="w-full mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs"
      >
        <FileText className="h-3 w-3" />
        {documents.length} Source Document{documents.length > 1 ? 's' : ''}
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {documents.map((doc, index) => (
            <Card key={index} className="text-xs">
              <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {doc.metadata.source?.split('/').pop() || 'Document'}
                  {doc.metadata.page && (
                    <span className="text-muted-foreground">
                      (Page {doc.metadata.page_label || doc.metadata.page})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-muted-foreground line-clamp-3">
                  {doc.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};