import { CYLINDER_LAYOUTS, ENGINE_CLASSES, FUEL_TYPES, InductionSystem, LimiterInfo } from "@srk-automotive/redline-types";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const manufacturersTable = sqliteTable("manufacturers", {
  id: text("id").primaryKey(), // Internal UUID
  name: text("name").notNull().unique(),
});

export const enginesTable = sqliteTable("engines", {
  id: text("id").primaryKey(), // Internal UUID
  projectId: text("project_id"),

  // Required Core Fields
  manufacturerId: text("manufacturer_id").notNull().references(() => manufacturersTable.id),
  engineClass: text("engine_class", {
    enum: Object.keys(ENGINE_CLASSES) as [string, ...string[]]
  }).notNull(),
  cylinderLayout: text("cylinder_layout", {
    enum: Object.keys(CYLINDER_LAYOUTS) as [string, ...string[]]
  }).notNull(),
  noCylinders: integer("no_cylinders").notNull(),
  displacement: real("displacement").notNull(),
  fuelType: text("fuel_type", {
    enum: Object.keys(FUEL_TYPES) as [string, ...string[]]
  }).notNull(),

  // Optional / Mechanical Fields
  oemEngineCode: text("oem_engine_code"),
  bore: real("bore"),
  stroke: real("stroke"),
  maxRpm: integer("max_rpm"),
  power: real("power"),
  torque: real("torque"),
  compressionRatio: real("compression_ratio"),

  // Complex Objects stored as JSON
  induction: text("induction", { mode: "json" }).$type<InductionSystem>(),
  limiters: text("limiters", { mode: "json" }).$type<Record<number, LimiterInfo>>(),

  // Metadata
  valvetrain: text("valvetrain").default("Hydraulic"),
  vvt: text("vvt").default("None"),
  drySump: integer("dry_sump", { mode: "boolean" }).default(false),
});