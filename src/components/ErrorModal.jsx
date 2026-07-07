"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BsExclamationTriangle } from "react-icons/bs";

export default function ErrorModal({
  open,
  errorText = "An error occurred.",
  onClose,
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs rounded-2xl p-5 shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-red-700">
            <BsExclamationTriangle className="h-5 w-5 text-red-600 shrink-0" />
            Something went wrong
          </DialogTitle>
        </DialogHeader>

        {/* Error message */}
        <p className="text-sm text-gray-600 leading-relaxed">{errorText}</p>

        {/* Action Button */}
        <DialogFooter className="mt-2">
          <Button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer px-5 py-2 h-9 rounded-lg text-sm font-medium w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
