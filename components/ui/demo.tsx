import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { assistenciaTimelineData } from "@/components/assistencia-tecnica-orbital";

export function AssistenciaTecnicaTimelineDemo() {
  return <RadialOrbitalTimeline timelineData={assistenciaTimelineData} />;
}

export const RadialOrbitalTimelineDemo = AssistenciaTecnicaTimelineDemo;
