import type { StepStatus } from "../../store/executionStore";

interface Props {
  status: StepStatus | undefined;
}

export function NodeStatusBadge({ status }: Props) {
  if (!status || status === "pending") return null;

  if (status === "running") {
    return (
      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-surface-0 border-2 border-surface-3 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-md">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-md">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  if (status === "skipped") {
    return (
      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-surface-3 flex items-center justify-center shadow-md">
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </div>
    );
  }
  return null;
}
