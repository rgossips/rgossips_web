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
      <DialogContent className="max-w-sm rounded-2xl p-6 shadow-lg">
        <DialogHeader className="">
          <div className="flex w-full items-center justify-center gap-3 ">
            {" "}
            <BsExclamationTriangle className="h-12 w-12 text-red-600" />
            <div className="text-2xl font-bold text-red-700"> Error</div>
          </div>
          <DialogTitle></DialogTitle>
        </DialogHeader>

        {/* Error message */}
        <div className="mt-3">
          <p className="text-center text-xl text-gray-700 leading-relaxed">
            {errorText}
          </p>
        </div>

        {/* Action Button */}
        <DialogFooter className="mt-6 flex justify-center">
          <Button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer px-6 py-2 rounded-lg font-medium"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
