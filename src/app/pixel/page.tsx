import { Stage } from "@/components/Stage";

export default function PixelPage() {
  return (
    <Stage
      variant="scene"
      caption="thinking · night runner"
      hint="Tap the card to collapse it back to the pill"
      links={[
        { href: "/", label: "← Steps" },
        { href: "/day", label: "Daylight →" },
      ]}
    />
  );
}
