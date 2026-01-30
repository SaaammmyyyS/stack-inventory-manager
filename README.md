# stack-inventory-manager

A multi-tenant SaaS platform for real-time inventory management built with a focus on **data isolation, concurrency safety, and subscription-aware backend enforcement**.

The system addresses a common B2B SaaS challenge: multiple organizations sharing infrastructure without ever sharing data, while supporting high write throughput, operational correctness, and feature-tier differentiation.

The AI layer follows a **grounded analytics approach**, where live transactional data is programmatically assembled and provided to the model for contextual analysis — rather than relying on embedding-based retrieval (RAG).



## 🏗️ System Architecture
```mermaid
graph TD
    subgraph Client_Layer [Frontend: React 19 + TypeScript]
        User((User)) --> WebApp[Vite Dashboard]
        WebApp -.->|JWT/OIDC| Clerk[Clerk Auth]
    end

    subgraph API_Layer [Backend: Spring Boot 3.4]
        WebApp -- "HTTP + X-Tenant-ID" --> Gateway[Spring Security Filter Chain]
        Gateway -- "TenantContext Holder" --> Controller[Inventory Controller]
        Controller --> DTO[DTO Projection Layer]
        DTO --> Service[Inventory Service]
        Service --> AiSvc[Grounded Analytics Service]
        AiSvc --> LLM[LLM via Spring AI / OpenAI]
    end

    subgraph Data_Layer [Persistence: PostgreSQL]
        Service -- "Hibernate @TenantId" --> DB[(Supabase/Postgres)]
        DB --> Logic{Soft Delete / Audit}
    end

    subgraph Infrastructure [DevOps]
        TF[Terraform] --> AppRunner[AWS App Runner]
        TF --> ECR[Amazon ECR]
    end

```
## 🛠️ Technical Specifications

### Backend (saas-manager)
* **Runtime:** Java 21 (Amazon Corretto) utilizing **Virtual Threads** for high-throughput I/O.
* **Multi-tenancy:** Shared-database, shared-schema approach using **Hibernate 7 `@TenantId`**. Tenant resolution is handled via a custom `CurrentTenantIdentifierResolver` linked to the `X-Tenant-ID` header.
* **Persistence:** PostgreSQL (Supabase) with **Hibernate Soft Delete** for lifecycle management.
* **Security:** Stateless JWT validation with **Method-Level RBAC** using `@PreAuthorize`.
* **Reporting:** Low-overhead PDF generation via **OpenPDF**, avoiding the resource cost of headless browser rendering.

### Frontend (frontend)
* **Framework:** React 19 (Concurrent Mode) + Vite.
* **State Management:** React Query for server-state synchronization and optimistic UI updates.
* **Auth/Billing:** Clerk-integrated middleware for organization-switching and Stripe-gated API access.

### Infrastructure
* **Provider:** AWS (Region: `ap-southeast-1`).
* **Deployment:** Containerized via **multi-stage Docker builds** (distroless-style) and deployed on **AWS App Runner**.
* **IaC:** Terraform modules for VPC-less App Runner configuration and ECR lifecycle policies.

## 🚀 Engineering Highlights

### 1. Robust Data Isolation
Unlike standard "Where" clause filtering, this system implements **Hibernate 7 Tenant Filtering** at the session level. Every database interaction is natively scoped to a `tenant_id`, mitigating the risk of Cross-Tenant Data Leaks—a critical requirement for B2B SaaS compliance.

### 2. Strict DTO & Contract Integrity
The `saas-manager` enforces a strict separation between the Persistence Layer and the Web Layer. 
* **Inbound:** Request DTOs validate constraints before hitting the service layer.
* **Outbound:** Projections ensure internal database schemas (like password hashes or internal IDs) are never leaked to the frontend.

### 3. Predictive "Days-Until-Out" Analysis

Forecasting uses a hybrid deterministic + grounded LLM analytics approach.

- **Deterministic Core:** Consumption velocity is calculated using rolling 7-day and 30-day windows. A linear regression model predicts the estimated depletion date based on historical stock-out trends.
- **Grounded LLM Layer:** Structured inventory data, recent transactions, and computed metrics are assembled at runtime and injected into the LLM prompt for contextual analysis and human-readable insight generation.
- **Not RAG:** The system does not use embedding-based document retrieval. Instead, it relies on deterministic database queries to provide real-time operational context.
- **Safety Model:** Alerts and reorder thresholds remain rule-based to prevent non-deterministic AI output from affecting operational correctness.
- **Cost Control:** Forecasting operations are batched per tenant to avoid per-request LLM overhead.

This ensures forecasting remains explainable, context-aware, and operationally safe.


### 4. Subscription-Aware Feature Gating
The backend doesn't just check roles; it checks **Tenant Plan Metadata**. High-compute tasks (like AI forecasting and PDF batch processing) are intercepted by a `SubscriptionGuard` that validates the organization's Stripe status via Clerk metadata before execution.

## 🧠 AI Architecture Approach

The AI system follows a **Structured Context Grounding** pattern:

1. Application queries relevant inventory items and transaction history
2. Metrics (velocity, trends, depletion estimates) are computed deterministically
3. Structured context is assembled and injected into the LLM prompt
4. The LLM produces analysis, explanations, and recommendations

This differs from traditional RAG systems, which rely on vector databases and semantic retrieval. Here, the context source of truth is the live transactional database, ensuring responses remain aligned with real operational data.



## ⚖️ Engineering Tradeoffs

| Decision | Benefit | Cost / Limitation |
|----------|---------|-------------------|
| Shared-schema multi-tenancy | Simple scaling and migrations | Harder per-tenant indexing |
| Hibernate tenant filters | Automatic isolation enforcement | Native queries require manual review |
| Virtual Threads | Handles blocking I/O at scale | More complex thread dump analysis |
| App Runner over ECS/EKS | No cluster operations overhead | Less infrastructure-level control |
| AI-assisted insights | Faster iteration | Non-deterministic output and cost per call |
| Soft delete strategy | Preserves audit history | Reporting queries require explicit filter control |

    
