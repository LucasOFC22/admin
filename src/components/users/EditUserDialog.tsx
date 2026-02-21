
import React from 'react';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditUserDialog = ({ open, onOpenChange }: EditUserDialogProps) => (
  <div>{open ? <div>Edit User Dialog - N8N integrated</div> : null}</div>
);

export default EditUserDialog;
