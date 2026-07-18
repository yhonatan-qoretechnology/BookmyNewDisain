"use client";
import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "md" | "sm";
  block?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  block = false,
  className = "",
  ...rest
}: ButtonProps) {
  const cls = [
    styles.btn,
    styles[variant],
    size === "sm" ? styles.sm : "",
    block ? styles.block : "",
    className,
  ].filter(Boolean).join(" ");
  return <button className={cls} {...rest} />;
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean;
}

export function IconButton({ danger = false, className = "", ...rest }: IconButtonProps) {
  const cls = [styles.iconBtn, danger ? styles.iconBtnDanger : "", className]
    .filter(Boolean).join(" ");
  return <button className={cls} {...rest} />;
}
