/**
 * ExportButton Component
 * Reusable export button that opens the export dialog
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';
import { ExportDialog } from './ExportDialog';

interface ExportButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function ExportButton({
  variant = 'outline',
  size = 'default',
  className = '',
}: ExportButtonProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowExportDialog(true)}
        className={className}
      >
        <DownloadIcon className="mr-2 h-4 w-4" />
        Export
      </Button>

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </>
  );
}
