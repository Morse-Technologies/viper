"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { Camera, Machine } from "@/lib/api/types";
import { fmtAgo, fmtNum } from "@/lib/format";
import { Button, HoldButton, Pill } from "@/ui/atoms";
import { CameraFrame } from "@/ui/organisms/CameraFrame";
import { ROI_TASK_LABEL } from "./constants";

function RoiReading({ reading }: { reading: Camera["rois"][number]["reading"] }) {
  if (!reading) return <span className="text-muted">—</span>;
  return (
    <span className="num">
      {fmtNum(reading.value)} {reading.unit} · {fmtAgo(reading.at)}
    </span>
  );
}

function RoiList({ camera }: { camera: Camera }) {
  return (
    <ul className="divide-y divide-rule">
      {camera.rois.map((roi) => (
        <li key={roi.id} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-body font-medium">{roi.name}</span>
            <span className="text-small text-muted">{ROI_TASK_LABEL[roi.task]}</span>
          </div>
          <p className="text-small text-muted"><RoiReading reading={roi.reading} /></p>
        </li>
      ))}
    </ul>
  );
}

function ReferenceControl({ approved, onApprove }: { approved: boolean; onApprove: () => void }) {
  if (approved) return <Pill tone="positive">Reference approved</Pill>;
  return (
    <HoldButton variant="primary" doneLabel="Reference approved" onConfirm={onApprove}>
      Hold to approve reference
    </HoldButton>
  );
}

export function CameraDetail({ camera, machine }: { camera: Camera; machine: Machine | undefined }) {
  const [approved, setApproved] = useState(camera.referenceApproved);

  const approve = () => {
    setApproved(true);
    toast.success(`Reference approved for ${camera.name}`);
  };

  return (
    <div className="flex flex-col gap-5 px-5 py-4">
      <CameraFrame camera={camera} showRois showAnomaly />
      <div>
        <p className="mb-2 text-small text-muted">{machine?.code ?? "—"} · {machine?.name ?? camera.name}</p>
        <RoiList camera={camera} />
      </div>
      <div className="flex flex-col gap-2">
        <ReferenceControl approved={approved} onApprove={approve} />
        <p className="text-small text-muted">
          Live view needs the media:live permission and is audited.
        </p>
        <Button
          variant="outline"
          className="self-start opacity-60"
          onClick={() => toast("Live view is not available in the mock")}
        >
          Open live view
        </Button>
      </div>
    </div>
  );
}
