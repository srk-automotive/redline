import { COUNTRY_CODES } from "@srk-automotive/redline-types";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const manufacturers = sqliteTable("manufacturers", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  country: text("country", { enum: COUNTRY_CODES as unknown as [string, ...string[]] }),
});