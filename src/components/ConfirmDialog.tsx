"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  /** Extra line under the body — e.g. a summary of the file about to be imported. */
  detail?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  /** Safer alternative offered alongside the destructive action (e.g. "back up first"). */
  altLabel?: string;
  onAlt?: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  detail,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger,
  altLabel,
  onAlt,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {body}
          </DialogDescription>
        </DialogHeader>
        {detail && <p className="text-sm text-muted-foreground mt-2">{detail}</p>}
        {altLabel && onAlt && (
          <Button variant="outline" className="w-full mt-4" onClick={onAlt}>
            {altLabel}
          </Button>
        )}
        <DialogFooter className="mt-4 sm:justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "destructive" : "default"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
