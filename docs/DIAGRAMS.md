# Diagrams

## System Diagram

```mermaid
flowchart TD
    A["User"] --> B["Web App"]
    B --> C["API"]
    C --> D["xStocks Package"]
    C --> E["Euler Package"]
    C --> F["Policy Package"]
    G["Worker"] --> H["Research Package"]
    H --> C
    D --> I["Official xStocks APIs"]
    E --> J["Euler market / EVC surfaces"]
    C --> K["Postgres"]
```

## Product Modes

```mermaid
flowchart LR
    A["xStocks Strategy Lab"] --> B["Autopilot"]
    A --> C["Directional Vault"]
    B --> D["Starter baskets"]
    B --> E["Recommendation + replay"]
    B --> J["Theme-led discovery"]
    B --> F["Activation fallback live path"]
    C --> G["Long / short entry"]
    C --> H["Health factor preview"]
    C --> I["Hero long/short mode"]
    C --> K["Venue + vault transparency"]
```

## First User Journey

```mermaid
flowchart TD
    A["Home terminal"] --> B["Pick a theme or strategy mode"]
    B --> C["Comparison / replay workspace"]
    C --> D["Detail + route + vault context"]
    D --> E["Connect wallet"]
    E --> F["Activate strategy"]
    F --> G["Activity / paused state"]
    G --> H["Bottom blotter: positions / history / activity"]
```
