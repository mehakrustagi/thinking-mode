import { Stage } from "@/components/Stage";

export default function Page() {
  return (
    <Stage
      variant="steps"
      caption="thinking · steps"
      hint="Tap the pill to open the agent steps"
      links={[
        { href: "/pixel", label: "Night runner →" },
        { href: "/day", label: "Daylight →" },
        { href: "/scenes", label: "All scenes →" },
        { href: "/loaders", label: "Loaders →" },
      ]}
    />
  );
}
