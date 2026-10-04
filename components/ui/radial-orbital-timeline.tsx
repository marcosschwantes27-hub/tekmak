import { useEffect, useRef, useState } from "react";
import type { ElementType } from "react";
import { ArrowRight, Link2, Wrench, X } from "lucide-react";

export interface TimelineItem {
  id: number;
  title: string;
  shortTitle: string;
  shortDescription: string;
  content: string;
  icon: ElementType;
  relatedIds: number[];
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({ timelineData }: RadialOrbitalTimelineProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const satellitesRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const activeNodeIdRef = useRef<number | null>(null);
  const moveRef = useRef<{ from: number; to: number; start: number } | null>(null);
  const [stageWidth, setStageWidth] = useState(0);
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width));
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const satellites = satellitesRef.current;
    if (!stage || !satellites) return;
    const contents = satellites.querySelectorAll<HTMLElement>(".assist-orbit-node-content");
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let previousTime = performance.now();
    const frame = (now: number) => {
      const elapsed = Math.min(now - previousTime, 64);
      previousTime = now;
      const move = moveRef.current;
      if (move) {
        const progress = motionPreference.matches ? 1 : Math.min((now - move.start) / 1800, 1);
        const eased = 1 - (1 - progress) ** 3;
        rotationRef.current = move.from + (move.to - move.from) * eased;
        if (progress === 1) moveRef.current = null;
      } else {
        if (activeNodeIdRef.current === null && !motionPreference.matches && !document.hidden) {
          rotationRef.current += elapsed * 360 / 48000;
        }
      }
      satellites.style.transform = `rotate(${rotationRef.current}deg)`;
      contents.forEach(content => { content.style.transform = `rotate(${-rotationRef.current}deg)`; });
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const closeDetail = () => {
    moveRef.current = null;
    activeNodeIdRef.current = null;
    setActiveNodeId(null);
  };

  useEffect(() => {
    if (activeNodeId === null) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDetail();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && stageRef.current?.contains(target) && target.closest(".assist-orbit-dot, .assist-orbit-card")) return;
      closeDetail();
    };
    window.addEventListener("keydown", onEscape);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onEscape);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [activeNodeId]);

  const selectNode = (id: number, index: number) => {
    if (activeNodeIdRef.current === id) {
      closeDetail();
      return;
    }
    const baseAngle = -120 + index * (360 / timelineData.length);
    const current = rotationRef.current;
    let diff = ((-90 - baseAngle - current) % 360);
    if (diff < 0) diff += 360;
    moveRef.current = { from: current, to: current + diff, start: performance.now() };
    activeNodeIdRef.current = id;
    setActiveNodeId(id);
  };

  const radius = Math.min(205, Math.max(105, (stageWidth - 112) / 2));
  const activeItem = timelineData.find(item => item.id === activeNodeId);
  const pointFor = (index: number) => {
    const angle = (-120 + index * (360 / timelineData.length)) * Math.PI / 180;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  };

  return (
    <div className={`assist-orbit${activeNodeId !== null ? " is-paused" : ""}`} ref={stageRef} aria-label="Tópicos da assistência técnica">
      <div className="assist-orbit-ring" style={{ width: radius * 2, height: radius * 2 }} aria-hidden="true" />
      <div className="assist-orbit-core" aria-label="Suporte Tekmak">
        <span className="assist-orbit-core-track" aria-hidden="true" />
        <Wrench size={37} strokeWidth={3} aria-hidden="true" />
        <span>SUPORTE</span>
        <img className="assist-orbit-logo" src="assets/logo-tekmak-light.webp" alt="Tekmak do Brasil" />
      </div>
      <div className="assist-orbit-satellites" ref={satellitesRef}>
      {timelineData.map((item, index) => (
        <span
          className="assist-orbit-spoke"
          key={`spoke-${item.id}`}
          style={{ width: Math.hypot(pointFor(index).x, pointFor(index).y) - 20, transform: `rotate(${Math.atan2(pointFor(index).y, pointFor(index).x) * 180 / Math.PI}deg)` }}
          aria-hidden="true"
        />
      ))}
      {timelineData.map((item, index) => {
        const { x, y } = pointFor(index);
        const isActive = item.id === activeNodeId;
        const isRelated = !!activeItem?.relatedIds.includes(item.id);
        const Icon = item.icon;
        return (
          <div
            className={`assist-orbit-node${isActive ? " is-active" : ""}${isRelated ? " is-related" : ""}`}
            key={item.id}
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            <div className="assist-orbit-node-content">
            <button
              className="assist-orbit-dot"
              type="button"
              aria-label={item.title}
              aria-expanded={isActive}
              aria-controls={isActive ? "assistencia-detalhe" : undefined}
              onClick={() => selectNode(item.id, index)}
            >
              <Icon size={17} aria-hidden="true" />
            </button>
            <span className="assist-orbit-node-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <span className="assist-orbit-node-label" aria-hidden="true"><strong>{item.shortTitle}</strong><small>{item.shortDescription}</small></span>
            </div>
          </div>
        );
      })}
      </div>
      {activeItem && (
        <div className="assist-orbit-card" id="assistencia-detalhe">
          <button className="assist-orbit-card-close" type="button" aria-label="Fechar detalhe" onClick={closeDetail}><X size={16} aria-hidden="true" /></button>
          <p className="assist-orbit-card-kicker">Assistência Técnica</p>
          <h3>{activeItem.title}</h3>
          <p>{activeItem.content}</p>
          {activeItem.relatedIds.length > 0 && (
            <div className="assist-orbit-related">
              <span><Link2 size={12} aria-hidden="true" /> Explore também</span>
              <div>
                {activeItem.relatedIds.map(relatedId => {
                  const related = timelineData.find(candidate => candidate.id === relatedId);
                  if (!related) return null;
                  return <button key={relatedId} type="button" onClick={() => selectNode(relatedId, timelineData.findIndex(candidate => candidate.id === relatedId))}>{related.shortTitle}<ArrowRight size={11} aria-hidden="true" /></button>;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
