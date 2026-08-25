src/
├── app/
│ ├── providers/ # ThemeProvider, QueryClientProvider, RouterProvider
│ ├── styles/ # global.css, reset.css
│ └── index.tsx # entry point
│
├── pages/
│ ├── workflow-overview/
│ │ └── ui/
│ │ └── WorkflowOverviewPage.tsx # chỉ ghép widget + feature lại
│ ├── workflow-detail/
│ │ └── ui/
│ │ └── WorkflowDetailPage.tsx
│ └── index.ts # re-export tất cả page cho router
│
├── widgets/
│ ├── workflow-table/ # khối UI lớn: bảng + phân trang + sort
│ │ ├── ui/
│ │ │ ├── TableView.tsx
│ │ │ └── GridView.tsx
│ │ ├── model/
│ │ │ └── useWorkflowSort.ts
│ │ └── index.ts # public API — chỉ export cái được phép dùng từ ngoài
│ ├── workflow-detail-tabs/ # khối tab: overview/analytics/diagram/logs/settings
│ │ ├── ui/
│ │ │ ├── OverviewTab.tsx
│ │ │ ├── AnalyticsTab.tsx
│ │ │ ├── DiagramTab.tsx
│ │ │ ├── LogsTab.tsx
│ │ │ └── SettingsTab.tsx
│ │ └── index.ts
│ └── workflow-analytics-dashboard/ # KPI + chart tổng quan
│ ├── ui/
│ └── index.ts
│
├── features/
│ ├── filter-workflow/
│ │ ├── ui/
│ │ │ └── FilterDropdown.tsx
│ │ ├── model/
│ │ │ └── useWorkflowFilters.ts
│ │ └── index.ts
│ ├── create-workflow/
│ │ ├── ui/
│ │ │ └── CreateWorkflowModal.tsx
│ │ ├── model/
│ │ │ └── useCreateWorkflow.ts
│ │ └── index.ts
│ ├── import-workflow/
│ │ ├── ui/
│ │ │ └── ImportWorkflowModal.tsx
│ │ ├── model/
│ │ │ └── useImportWorkflow.ts
│ │ └── index.ts
│ └── run-workflow-now/
│ ├── model/
│ │ └── useRunWorkflow.ts
│ └── index.ts
│
├── entities/
│ └── workflow/
│ ├── ui/
│ │ ├── StatusDot.tsx # hiển thị gắn liền với model Workflow
│ │ └── NodeDiagramPreview.tsx
│ ├── model/
│ │ ├── workflow.types.ts
│ │ ├── workflow.constants.ts # STATUS_META, PLATFORM_META, TRIGGER_META
│ │ └── workflow.rules.ts # pure function nghiệp vụ: canRetry(), nextRunTime()
│ ├── api/
│ │ └── workflow.api.ts # getWorkflows, getWorkflowById, createWorkflow...
│ └── index.ts
│
└── shared/
├── ui/ # Pill, KpiCard, Sparkline, TabStrip, ModalShell — không biết "workflow" là gì
├── lib/
│ ├── formatters.ts # timeAgo, fmtNumber, fmtDuration
│ └── random.ts
├── api/
│ └── apiClient.ts # instance axios/fetch dùng chung toàn app
└── config/
└── routes.ts
