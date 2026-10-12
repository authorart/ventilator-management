export type Role = "ADMIN" | "EQUIPMENT_CENTER" | "WARD_STAFF";

export const permissions = {
  canViewAllWards: (role: Role) => role === "ADMIN" || role === "EQUIPMENT_CENTER",
  canEditFleet: (role: Role) => role === "ADMIN" || role === "EQUIPMENT_CENTER",
  canMoveVentilator: (role: Role) => role === "ADMIN" || role === "EQUIPMENT_CENTER",
  canReportProblem: () => true,
  canProcessMaintenance: (role: Role) => role === "ADMIN" || role === "EQUIPMENT_CENTER",
  canProcessDisposal: (role: Role) => role === "ADMIN" || role === "EQUIPMENT_CENTER",
  canManageLocations: (role: Role) => role === "ADMIN" || role === "EQUIPMENT_CENTER",
  canManageUsers: (role: Role) => role === "ADMIN",
};
