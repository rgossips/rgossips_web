"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function SuccessModal({
  open,
  onClose,
  title = "Success!",
  message = "Saved successfully!",
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-gray-600 mt-2">{message}</p>

        <Button
          onClick={onClose}
          className="mt-4 w-full bg-green-600 hover:bg-green-700"
        >
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
