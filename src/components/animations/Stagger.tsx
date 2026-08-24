"use client";
/* ============================================================
   StaggerContainer / StaggerItem — entrada escalonada
   ------------------------------------------------------------
   El contenedor no anima nada por sí mismo: orquesta a sus hijos
   mediante variantes, de modo que cada uno entra un poco después
   que el anterior. Para tablas usa as="tbody" en el contenedor y
   as="tr" en cada fila, así el HTML sigue siendo válido.

       <StaggerContainer as="tbody">
         {filas.map(f => <StaggerItem as="tr" key={f.id}>…</StaggerItem>)}
       </StaggerContainer>

   `key` en el contenedor (p. ej. el término de búsqueda) hace que
   la lista vuelva a entrar escalonada al cambiar los filtros.
============================================================ */
import { motion, useReducedMotion } from "framer-motion";
import { STAGGER, staggerChild, staggerParent } from "./transitions";
import type { MotionTag } from "./types";

interface StaggerContainerProps {
  children: React.ReactNode;
  as?: MotionTag;
  /** Retardo entre hijos en segundos */
  stagger?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function StaggerContainer({
  children,
  as = "div",
  stagger = STAGGER,
  className,
  style,
}: StaggerContainerProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      style={style}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        ...staggerParent,
        visible: {
          transition: {
            /* Sin movimiento reducido no tiene sentido escalonar */
            staggerChildren: reduce ? 0 : stagger,
            delayChildren: reduce ? 0 : 0.02,
          },
        },
      }}
    >
      {children}
    </Tag>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  as?: MotionTag;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler;
}

export function StaggerItem({
  children,
  as = "div",
  className,
  style,
  onClick,
}: StaggerItemProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      style={style}
      onClick={onClick}
      variants={
        reduce
          ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
          : staggerChild
      }
    >
      {children}
    </Tag>
  );
}
