import { Stage } from "@/components/Stage";

export default function DayPage() {
  return (
    <Stage
      variant="scene"
      theme="day"
      caption="thinking · daylight"
      hint="Same runner, woven palette"
      links={[
        { href: "/", label: "← Steps" },
        { href: "/pixel", label: "← Night runner" },
        { href: "/scenes", label: "All scenes →" },
      ]}
    />
  );
}
