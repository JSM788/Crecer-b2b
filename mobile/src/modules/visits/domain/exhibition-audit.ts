export type ExhibitionAudit = {
  hasShelfStock: boolean;
  noStockReason?: string;
  brandDisplay: "adequate" | "inadequate";
  pricesVisible: boolean;
};

export const noStockReasonLimit = 1000;

export function validateAudit(value: unknown): ExhibitionAudit {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("invalid_audit");
  const audit = value as Record<string, unknown>;
  const allowed = [
    "hasShelfStock",
    "noStockReason",
    "brandDisplay",
    "pricesVisible",
  ];
  if (
    Object.keys(audit).some((key) => !allowed.includes(key)) ||
    typeof audit.hasShelfStock !== "boolean" ||
    typeof audit.pricesVisible !== "boolean" ||
    !["adequate", "inadequate"].includes(String(audit.brandDisplay)) ||
    (audit.noStockReason !== undefined &&
      typeof audit.noStockReason !== "string")
  )
    throw new Error("invalid_audit");
  const reason = (audit.noStockReason as string | undefined)?.trim();
  if (
    (!audit.hasShelfStock && !reason) ||
    (reason?.length ?? 0) > noStockReasonLimit
  )
    throw new Error("invalid_audit");
  return {
    hasShelfStock: audit.hasShelfStock,
    ...(reason !== undefined ? { noStockReason: reason } : {}),
    brandDisplay: audit.brandDisplay as ExhibitionAudit["brandDisplay"],
    pricesVisible: audit.pricesVisible,
  };
}
