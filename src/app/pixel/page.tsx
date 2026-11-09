import { Stage } from "@/components/Stage";

export default function PixelPage() {
  return (
    <Stage
      variant="scene"
      caption="thinking · landscape"
      hint="Tap the card to collapse it back to the pill"
      other={{ href: "/", label: "← Steps version" }}
    />
  );
}
