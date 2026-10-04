import { Headphones, MapPin, GraduationCap, ShieldCheck, Wrench, Heart } from "lucide-react";
import RadialOrbitalTimeline, { type TimelineItem } from "@/components/ui/radial-orbital-timeline";

export const assistenciaTimelineData: TimelineItem[] = [
  {
    id: 1,
    title: "Suporte técnico remoto",
    shortTitle: "Suporte remoto",
    shortDescription: "Orientações e diagnóstico à distância.",
    content: "Nossa equipe oferece orientações, configurações e diagnósticos que possam ser realizados à distância. Uma primeira avaliação remota ajuda a verificar se a situação pode ser resolvida nesse atendimento ou se será necessária uma visita técnica.",
    icon: Headphones,
    relatedIds: [2, 5]
  },
  {
    id: 2,
    title: "Atendimento técnico presencial",
    shortTitle: "Presencial",
    shortDescription: "Equipe técnica em campo.",
    content: "Quando o equipamento precisa de intervenção, planejamos o atendimento técnico presencial conforme a localização e a necessidade do cliente.",
    icon: MapPin,
    relatedIds: [1, 5]
  },
  {
    id: 3,
    title: "Instalação e treinamento",
    shortTitle: "Instalação",
    shortDescription: "Configuração e orientação da equipe.",
    content: "Acompanhamos a instalação do equipamento e preparamos a equipe do cliente para utilizar a máquina corretamente, com orientações de operação e conservação.",
    icon: GraduationCap,
    relatedIds: [4, 6]
  },
  {
    id: 4,
    title: "Manutenção preventiva",
    shortTitle: "Preventiva",
    shortDescription: "Menos risco de paradas inesperadas.",
    content: "Manutenções e revisões periódicas ajudam a reduzir o risco de paradas inesperadas, manter a estabilidade da produção e contribuir para a vida útil do equipamento.",
    icon: ShieldCheck,
    relatedIds: [3, 5]
  },
  {
    id: 5,
    title: "Diagnóstico e manutenção corretiva",
    shortTitle: "Corretiva",
    shortDescription: "Falhas identificadas e corrigidas.",
    content: "Identificamos falhas e realizamos os procedimentos necessários para restabelecer a operação do equipamento, com atendimento adequado a cada situação.",
    icon: Wrench,
    relatedIds: [1, 2, 4]
  },
  {
    id: 6,
    title: "Pós-venda que acompanha você",
    shortTitle: "Pós-venda",
    shortDescription: "Suporte contínuo para sua operação.",
    content: "Nosso relacionamento continua depois da entrega. Acompanhamos as necessidades técnicas dos equipamentos e orientamos nossos clientes sobre operação, cuidados e manutenção.",
    icon: Heart,
    relatedIds: [3, 4]
  }
];

export default function AssistenciaTecnicaOrbital() {
  return <RadialOrbitalTimeline timelineData={assistenciaTimelineData} />;
}
