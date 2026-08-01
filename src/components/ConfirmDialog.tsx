"use client";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  detail?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
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
    <Dialog
      open={open}
      onClose={onCancel}
      sx={{
        "& .MuiDialog-paper": { borderRadius: 3, p: 1 }
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: "bold" }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: "text.primary", mb: detail ? 2 : 0 }}>
          {body}
        </DialogContentText>
        {detail && (
          <DialogContentText variant="body2" sx={{ color: "text.secondary" }}>
            {detail}
          </DialogContentText>
        )}
        {altLabel && onAlt && (
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={onAlt}
              sx={{ borderRadius: 2 }}
            >
              {altLabel}
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit">
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color={danger ? "secondary" : "primary"}
          variant="contained"
          disableElevation
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
