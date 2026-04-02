import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const workflows = sqliteTable("workflows", {
  id:          text("id").primaryKey(),
  name:        text("name").notNull(),
  description: text("description"),
  nodes:       text("nodes").notNull(),
  edges:       text("edges").notNull(),
  isActive:    integer("is_active", { mode: "boolean" }).default(false),
  createdAt:   text("created_at").notNull(),
  updatedAt:   text("updated_at").notNull(),
});

export const executions = sqliteTable("executions", {
  id:           text("id").primaryKey(),
  workflowId:   text("workflow_id").notNull().references(() => workflows.id),
  status:       text("status").notNull(),
  triggeredAt:  text("triggered_at").notNull(),
  completedAt:  text("completed_at"),
  steps:        text("steps").notNull(),
});
