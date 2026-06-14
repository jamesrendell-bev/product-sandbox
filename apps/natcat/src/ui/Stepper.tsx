import { Check } from "lucide-react";

export interface StepView {
  num: string;
  label: string;
  sub: string;
  state: "active" | "done" | "todo";
  onClick: () => void;
}

export function Stepper({ steps }: { steps: StepView[] }) {
  return (
    <div className="stepperwrap">
      <nav className="stepper" aria-label="Workflow steps">
        {steps.map((s) => (
          <button
            key={s.num}
            className={`step ${s.state}`}
            onClick={s.onClick}
            aria-current={s.state === "active" ? "step" : undefined}
          >
            <span className="num">{s.state === "done" ? <Check size={15} strokeWidth={2.25} /> : s.num}</span>
            <span className="txt">
              <span className="lbl">{s.label}</span>
              <span className="sub">{s.sub}</span>
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
