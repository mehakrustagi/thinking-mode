import { Stage } from "@/components/Stage";

export default function Page() {
  return (
    <Stage
      variant="steps"
      caption="thinking · steps"
      hint="Tap the pill to open the agent steps"
      other={{ href: "/pixel", label: "Landscape version →" }}
    />
  );
}
