# Workflow Builder — Full-Stack Design Document

## 1. Overview

A visual, node-based workflow automation platform inspired by Zapier/n8n, targeting Web3 use cases. Users create workflows by connecting trigger nodes to action nodes on a canvas, configure each node's parameters, and persist/execute workflows via a backend API.

This document is intended as an implementation spec for an AI coding agent. Follow the project structure, data models, and API contracts exactly. Where a design decision is ambiguous, prefer simplicity.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + TypeScript + Vite | Fast dev server, strong typing |
| Canvas | `@xyflow/react` (React Flow v12) | Industry-standard node graph editor |
| Styling | Tailwind CSS | Utility-first, dark theme via config |
| State | Zustand | Lightweight, works well with React Flow |
| Backend | Node.js + Express + TypeScript | Shares types with frontend |
| Database | SQLite via `better-sqlite3` | Zero-config, file-based, good for single-user/dev |
| ORM | Drizzle ORM | Type-safe, lightweight, SQLite support |
| Validation | Zod | Shared schemas between client and server |

---

## 3. Project Structure

```
workflow-app/
├── package.json              # Workspace root (npm workspaces)
├── tsconfig.base.json        # Shared TS config
│
├── packages/
│   └── shared/               # Shared types & validation
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── types.ts       # Workflow, Node, Edge types
│           ├── schemas.ts     # Zod schemas
│           └── registry.ts   # Trigger & action definitions
│
├── apps/
│   ├── server/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── drizzle.config.ts
│   │   └── src/
│   │       ├── index.ts       # Express app entry
│   │       ├── db/
│   │       │   ├── schema.ts  # Drizzle table definitions
│   │       │   ├── migrate.ts # Migration runner
│   │       │   └── seed.ts    # Optional seed data
│   │       ├── routes/
│   │       │   ├── workflows.ts
│   │       │   └── executions.ts
│   │       └── engine/
│   │           ├── executor.ts    # Workflow execution engine
│   │           └── handlers/     # One file per trigger/action type
│   │               ├── x-post.ts
│   │               ├── balance.ts
│   │               ├── notification.ts
│   │               └── ...
│   │
│   └── client/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── styles/
│           │   └── globals.css
│           ├── store/
│           │   ├── workflowStore.ts   # Zustand: nodes, edges, selection
│           │   └── uiStore.ts         # Zustand: sidebar, panels, modals
│           ├── api/
│           │   └── client.ts          # Fetch wrapper for backend
│           ├── hooks/
│           │   ├── useWorkflow.ts     # CRUD operations
│           │   └── useAutoSave.ts     # Debounced persistence
│           ├── components/
│           │   ├── Canvas/
│           │   │   ├── Canvas.tsx          # React Flow wrapper
│           │   │   ├── CustomEdge.tsx      # Animated bezier edge
│           │   │   └── TriggerSection.tsx  # Dashed boundary group
│           │   ├── Nodes/
│           │   │   ├── TriggerNode.tsx
│           │   │   ├── ActionNode.tsx
│           │   │   ├── EmptyNode.tsx
│           │   │   └── nodeTypes.ts    # React Flow nodeTypes registry
│           │   ├── Sidebar/
│           │   │   ├── Sidebar.tsx
│           │   │   ├── SearchBar.tsx
│           │   │   ├── CategoryFilter.tsx
│           │   │   └── ItemCard.tsx
│           │   ├── ConfigPanel/
│           │   │   ├── ConfigPanel.tsx
│           │   │   ├── FieldRenderer.tsx   # Renders fields by type
│           │   │   └── TemplatePresets.tsx
│           │   ├── Toolbar/
│           │   │   ├── Toolbar.tsx         # Run, zoom, share buttons
│           │   │   └── ZoomControls.tsx
│           │   └── WorkflowList/
│           │       ├── WorkflowList.tsx    # Home page: list all workflows
│           │       └── WorkflowCard.tsx
│           └── lib/
│               ├── constants.ts
│               └── utils.ts
```

---

## 4. Data Models

### 4.1 Shared Types (`packages/shared/src/types.ts`)

```typescript
// --- Node Definition Registry ---
export type NodeCategory = "on-chain" | "off-chain";
export type NodeRole = "trigger" | "action";

export interface NodeDefinition {
  id: string;                    // e.g. "x-post", "swap"
  name: string;                  // e.g. "X Post Trigger"
  description: string;
  icon: string;                  // emoji or icon key
  color: string;                 // hex for node accent
  category: NodeCategory;
  role: NodeRole;
  configFields: ConfigField[];
  presets?: ConfigPreset[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "toggle" | "select" | "textarea";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];  // for select type
  defaultValue?: string | number | boolean;
}

export interface ConfigPreset {
  name: string;
  description: string;
  values: Record<string, unknown>;
}

// --- Workflow Data ---
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;           // ISO 8601
  updatedAt: string;
  isActive: boolean;
}

export interface WorkflowNode {
  id: string;
  definitionId: string;        // references NodeDefinition.id, or "empty"
  role: NodeRole;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;              // node id
  target: string;              // node id
  sourceHandle?: string;
  targetHandle?: string;
}

// --- Execution Log ---
export interface Execution {
  id: string;
  workflowId: string;
  status: "running" | "completed" | "failed";
  triggeredAt: string;
  completedAt?: string;
  steps: ExecutionStep[];
}

export interface ExecutionStep {
  nodeId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}
```

### 4.2 Database Schema (`apps/server/src/db/schema.ts`)

Three tables. The `nodes` and `edges` arrays are stored as JSON columns on the workflow row for simplicity. Executions are separate rows.

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const workflows = sqliteTable("workflows", {
  id:          text("id").primaryKey(),
  name:        text("name").notNull(),
  description: text("description"),
  nodes:       text("nodes").notNull(),     // JSON string of WorkflowNode[]
  edges:       text("edges").notNull(),     // JSON string of WorkflowEdge[]
  isActive:    integer("is_active", { mode: "boolean" }).default(false),
  createdAt:   text("created_at").notNull(),
  updatedAt:   text("updated_at").notNull(),
});

export const executions = sqliteTable("executions", {
  id:           text("id").primaryKey(),
  workflowId:   text("workflow_id").notNull().references(() => workflows.id),
  status:       text("status").notNull(),   // "running" | "completed" | "failed"
  triggeredAt:  text("triggered_at").notNull(),
  completedAt:  text("completed_at"),
  steps:        text("steps").notNull(),    // JSON string of ExecutionStep[]
});
```

---

## 5. API Endpoints

Base URL: `http://localhost:3001/api`

### 5.1 Workflows

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/workflows` | List all workflows (id, name, updatedAt, isActive) |
| `POST` | `/workflows` | Create new workflow. Body: `{ name }`. Returns full Workflow with empty nodes/edges |
| `GET` | `/workflows/:id` | Get full workflow with nodes and edges |
| `PUT` | `/workflows/:id` | Update workflow. Body: partial `Workflow` (name, description, nodes, edges, isActive) |
| `DELETE` | `/workflows/:id` | Delete workflow and its executions |
| `POST` | `/workflows/:id/duplicate` | Deep-copy a workflow. Returns the new Workflow |

### 5.2 Executions

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/workflows/:id/run` | Execute a workflow. Returns Execution with status "running" |
| `GET` | `/workflows/:id/executions` | List executions for a workflow (paginated) |
| `GET` | `/executions/:id` | Get single execution with step details |

### 5.3 Registry

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/registry/triggers` | List all available trigger definitions |
| `GET` | `/registry/actions` | List all available action definitions |

All endpoints return JSON. Errors follow `{ error: string, details?: unknown }`.

---

## 6. Frontend Architecture

### 6.1 Zustand Stores

**`workflowStore`** — owns the canvas state:

```typescript
interface WorkflowStore {
  // Data
  workflow: Workflow | null;
  nodes: Node[];              // React Flow node array
  edges: Edge[];              // React Flow edge array
  selectedNodeId: string | null;
  isDirty: boolean;

  // Actions
  loadWorkflow: (id: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;     // React Flow handler
  onEdgesChange: OnEdgesChange;     // React Flow handler
  onConnect: OnConnect;             // React Flow handler
  addNode: (definitionId: string, role: NodeRole, position?: XYPosition) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  assignDefinition: (nodeId: string, definitionId: string) => void;
}
```

**`uiStore`** — owns UI chrome:

```typescript
interface UIStore {
  sidebarTab: "trigger" | "action";
  sidebarFilter: "all" | "on-chain" | "off-chain";
  sidebarSearch: string;
  configPanelOpen: boolean;
  setSidebarTab: (tab: string) => void;
  setSidebarFilter: (filter: string) => void;
  setSidebarSearch: (query: string) => void;
}
```

### 6.2 React Flow Integration

**Canvas.tsx** is the core component:

```tsx
import { ReactFlow, Background, MiniMap, Controls } from "@xyflow/react";
import { nodeTypes } from "../Nodes/nodeTypes";
import { CustomEdge } from "./CustomEdge";

const edgeTypes = { custom: CustomEdge };

export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore();

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={{ type: "custom", animated: true }}
      snapToGrid
      snapGrid={[20, 20]}
      fitView
    >
      <Background variant="dots" gap={20} size={1} color="#1a1a1a" />
      <MiniMap
        nodeColor={(n) => n.data?.role === "trigger" ? "#E8652C" : "#444"}
        maskColor="#0a0a0acc"
      />
      <Controls />
    </ReactFlow>
  );
}
```

**Custom nodes** receive data via React Flow's `data` prop:

```typescript
// nodeTypes.ts
import { TriggerNode } from "./TriggerNode";
import { ActionNode } from "./ActionNode";
import { EmptyNode } from "./EmptyNode";

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  empty: EmptyNode,
};
```

Each node component renders a card with the icon, name, subtitle, and styled handles using React Flow's `<Handle>` component. The node's `type` field in the React Flow node array determines which component renders.

### 6.3 Auto-Save

`useAutoSave` debounces saves. Every time `isDirty` flips to true, it waits 1.5 seconds of inactivity then calls `saveWorkflow()`. A small "Saving..." / "Saved" indicator appears in the toolbar.

### 6.4 Drag from Sidebar

Sidebar items are draggable. On drop over the canvas, use React Flow's `screenToFlowPosition` to compute placement, then call `addNode()` with the drop coordinates. Also support click-to-add, which places the node below the lowest existing node.

### 6.5 Routing

Two routes only. Use `react-router-dom`:

| Path | View |
|------|------|
| `/` | `WorkflowList` — grid of workflow cards with create/delete |
| `/workflow/:id` | `Canvas` + `Sidebar` + `ConfigPanel` — the editor |

---

## 7. Node Definition Registry

Located in `packages/shared/src/registry.ts`. This is the single source of truth for what triggers and actions exist. Both the frontend sidebar and backend executor read from this.

### Triggers

| ID | Name | Config Fields |
|----|------|--------------|
| `x-post` | X Post | username (text, required), includeRetweets (toggle), keywords (text) |
| `balance` | Balance Monitor | address (text, required), token (text), threshold (number) |
| `every-period` | Every Period | interval (number), unit (select: minutes/hours/days) |
| `price-alert` | Price Alert | token (text), direction (select: above/below), price (number) |
| `new-block` | New Block | chain (select: ethereum/polygon/arbitrum) |
| `webhook` | Webhook | path (text, auto-generated), secret (text, auto-generated) |

### Actions

| ID | Name | Config Fields |
|----|------|--------------|
| `swap` | Swap Token | fromToken (text), toToken (text), amount (number), slippage (number) |
| `send-tx` | Send Transaction | to (text, required), value (number), data (textarea) |
| `notification` | Notification | channel (select: email/push/discord), message (textarea) |
| `post-x` | Post to X | content (textarea, required), replyTo (text) |
| `api-call` | API Call | url (text, required), method (select: GET/POST/PUT/DELETE), headers (textarea), body (textarea) |
| `condition` | Condition | field (text), operator (select: >/</==/!=/contains), value (text) |

---

## 8. Execution Engine

The executor lives at `apps/server/src/engine/executor.ts`. It is deliberately simple — a stub system that simulates execution rather than making real API calls.

### Flow

1. Receive `POST /workflows/:id/run`
2. Load the workflow from the database
3. Create an `Execution` row with status `"running"`
4. Topologically sort nodes using edges (triggers first, then actions in dependency order)
5. For each node in order:
   - Look up the handler in `engine/handlers/`
   - Call `handler.execute(config, previousOutputs)` which returns `{ output }` or throws
   - Update the execution step status
6. Mark execution as `"completed"` or `"failed"`
7. Return the execution result

### Handlers

Each handler file exports:

```typescript
export interface HandlerResult {
  output: Record<string, unknown>;
}

export async function execute(
  config: Record<string, unknown>,
  inputs: Record<string, unknown>
): Promise<HandlerResult> {
  // Stub implementation that returns mock data
  // Real implementation would call external APIs
}
```

For the initial build, all handlers return mock data after a small `setTimeout` delay to simulate async work.

### Expression-Based Data Mapping

Config field values support `{{nodeId.outputKey}}` expressions that reference outputs from upstream nodes. This enables data flow between nodes (e.g., a trigger's output feeding into an action's config).

**Syntax:** `{{<nodeId>.<outputKey>}}`

- `nodeId` — the UUID of an upstream node
- `outputKey` — a key from that node's output, supports dot-path traversal (e.g., `{{abc.payload.name}}`)

**Resolution rules:**
- Expressions are resolved at execution time by `resolveExpressions()` before passing config to handlers
- **Type preservation:** if the entire config value is a single expression (e.g., `"{{nodeId.amount}}"`), the original type (number, boolean, object) is preserved. Mixed expressions (e.g., `"Total: {{nodeId.amount}}"`) always resolve to strings.
- Missing references resolve to `""` (empty string) — no errors thrown
- Non-string config values pass through unchanged
- The executor tracks per-node outputs in `nodeOutputs: Record<string, Record<string, unknown>>`

**Frontend:** The ConfigPanel's FieldRenderer shows a `{ }` button on text/textarea fields. Clicking it opens a dropdown listing upstream nodes and their output fields. Clicking a field inserts the expression at the cursor position.

---

## 9. Theming

Dark theme only. Tailwind config:

```javascript
// tailwind.config.ts
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: "#080808",
          dot: "#1a1a1a",
        },
        surface: {
          0: "#0a0a0a",
          1: "#0f0f0f",
          2: "#151515",
          3: "#1a1a1a",
        },
        border: {
          subtle: "#1a1a1a",
          default: "#252525",
          strong: "#333333",
        },
        accent: {
          DEFAULT: "#E8652C",
          hover: "#F07A45",
          muted: "#E8652C22",
        },
        node: {
          trigger: "#E8652C",
          action: "#444444",
          empty: "#10B981",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
    },
  },
};
```

---

## 10. Implementation Order

Follow this sequence. Each step should be a working, runnable state before proceeding.

### Phase 1 — Scaffold

1. Initialize the workspace root with `npm workspaces`
2. Create `packages/shared` with types, schemas, and the node registry
3. Create `apps/server` with Express, Drizzle, SQLite, and the workflows CRUD routes
4. Create `apps/client` with Vite, React, Tailwind, and a placeholder App component
5. Verify both apps run (`npm run dev` from root starts server on 3001 and client on 5173)

### Phase 2 — Canvas

6. Install `@xyflow/react` and set up the Canvas component with Background, MiniMap, Controls
7. Create the three custom node components (TriggerNode, ActionNode, EmptyNode) with styled handles
8. Create the custom animated edge component
9. Set up the Zustand `workflowStore` with `onNodesChange`, `onEdgesChange`, `onConnect`
10. Hard-code an initial workflow to verify everything renders and connects

### Phase 3 — Sidebar + Config

11. Build the Sidebar with tab switching, category filters, search
12. Implement drag-from-sidebar-to-canvas using React Flow's drop API
13. Build the ConfigPanel with dynamic field rendering based on the node definition
14. Wire up `updateNodeConfig` and `assignDefinition` to the store
15. Implement template presets in the config panel

### Phase 4 — Persistence

16. Wire up the API client (`apps/client/src/api/client.ts`)
17. Implement `loadWorkflow` and `saveWorkflow` in the store
18. Add the `useAutoSave` hook with debounced saving
19. Build the WorkflowList page with create, rename, delete, and duplicate
20. Add `react-router-dom` with the two routes

### Phase 5 — Execution

21. Build the execution engine with topological sort
22. Add stub handlers for each node type
23. Wire up the Run button to `POST /workflows/:id/run`
24. Show execution status inline on nodes (green check, red X, spinner)
25. Build the execution history view (list + detail)

### Phase 6 — Polish

26. Add the trigger section dashed boundary group on the canvas
27. Add keyboard shortcuts (Delete to remove selected, Ctrl+S to save, Ctrl+Z undo)
28. Add a "Saving..." / "Saved" indicator in the toolbar
29. Add toast notifications for errors and success
30. Responsive sidebar collapse on narrow viewports

---

## 11. Agent Instructions

When implementing this spec:

- **Run the project after every phase** to verify nothing is broken. Fix errors before proceeding.
- **Use the shared package** for all types. Never duplicate type definitions.
- **Keep handlers minimal** — they are stubs that return mock data. Do not attempt real API integrations.
- **Vite proxy**: Configure `vite.config.ts` to proxy `/api` requests to `localhost:3001` so the client doesn't need CORS headers.
- **IDs**: Use `crypto.randomUUID()` for all IDs.
- **Error handling**: Every API route should have a try/catch that returns `{ error: message }` with appropriate status codes.
- **No authentication** — this is a single-user local tool.
- **No environment variables** — hard-code the SQLite path as `./data/workflows.db` relative to the server root.
- **Test each API endpoint with curl** after building it, before moving to the frontend integration.
