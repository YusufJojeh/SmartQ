# AI Assistant Tools Reference

## Overview

The assistant has access to 7 specialized tools for queue operations. Each tool has specific authorization requirements, input parameters, and output fields.

---

## Tool Access Matrix

| Tool | Public | Teller | Manager | Super Admin | Purpose |
|------|--------|--------|---------|------------|---------|
| `queue.status` | ✅ | ✅ | ✅ | ✅ | Current queue metrics and status |
| `ticket.status` | ✅ | ✅ | ✅ | ✅ | Lookup specific ticket |
| `branch.load` | ✅ | ✅ | ✅ | ✅ | Branch capacity analysis |
| `counters.status` | ✅ | ✅ | ✅ | ✅ | Active counters and assignments |
| `delay.explain` | ✅ | ✅ | ✅ | ✅ | Wait time analysis |
| `policy.read` | ✅ | ✅ | ✅ | ✅ | Current queue policy |
| `reports.summary` | ❌ | ❌ | ✅ | ✅ | Daily/weekly statistics |

---

## Tool 1: queue.status

Returns current queue status with ticket counts by status and estimated wait times.

### Purpose
- Quick queue overview
- Identify bottlenecks (which status has most tickets)
- Trending analysis

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | Optional | Filter by status: waiting, called, in_service, completed, cancelled |
| `branch_id` | integer | Optional | Filter by branch (managers restricted to own branch) |

### Input Example

```json
{
  "status": "waiting",
  "branch_id": 1
}
```

### Output Format

```json
{
  "data": {
    "queue_status": {
      "waiting": 5,
      "called": 2,
      "in_service": 3,
      "on_hold": 0,
      "completed": 145,
      "cancelled": 2,
      "missed": 1
    },
    "total_tickets_today": 158,
    "average_wait_minutes": 12,
    "oldest_waiting_ticket_minutes": 25,
    "timestamp": "2026-05-12T10:30:00Z"
  },
  "public_safe": true
}
```

### Output Fields

| Field | Type | Description |
|-------|------|-------------|
| `queue_status` | object | Ticket counts by status |
| `queue_status.waiting` | integer | Tickets waiting to be called |
| `queue_status.called` | integer | Tickets called but not yet served |
| `queue_status.in_service` | integer | Tickets being served |
| `queue_status.completed` | integer | Completed tickets |
| `total_tickets_today` | integer | All tickets from today |
| `average_wait_minutes` | integer | Average wait time |
| `oldest_waiting_ticket_minutes` | integer | Time since oldest waiting ticket joined |
| `timestamp` | string | Data collection time (ISO 8601) |

### When to Use

- Customer: "What is the queue status?"
- Customer: "How many people are waiting?"
- Manager: "Show me queue metrics"
- Staff: "How is the queue looking right now?"

---

## Tool 2: ticket.status

Look up a specific ticket and return its current status and details.

### Purpose
- Customer ticket verification
- Staff ticket lookup
- Service history

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticket_code` | string | Yes (one of) | Ticket code (e.g., "A001", "B123") |
| `ticket_id` | integer | Yes (one of) | Ticket database ID |

**Note**: Either `ticket_code` or `ticket_id` required, not both.

### Input Examples

```json
{
  "ticket_code": "ABC123"
}
```

or

```json
{
  "ticket_id": 456
}
```

### Output Format (Public Scope)

```json
{
  "data": {
    "ticket_number": "ABC123",
    "display_code": "123",
    "status": "in_service",
    "joined_at": "2026-05-12T10:00:00Z",
    "called_at": "2026-05-12T10:12:00Z",
    "service_started_at": "2026-05-12T10:15:00Z",
    "estimated_wait_remaining_minutes": 5,
    "service_category": "General Inquiry",
    "priority_level": 1
  },
  "public_safe": true
}
```

### Output Format (Operations Scope)

```json
{
  "data": {
    "ticket_number": "ABC123",
    "display_code": "123",
    "status": "in_service",
    "customer_name": "John Doe",
    "customer_phone": "+1234567890",
    "joined_at": "2026-05-12T10:00:00Z",
    "called_at": "2026-05-12T10:12:00Z",
    "service_started_at": "2026-05-12T10:15:00Z",
    "completed_at": null,
    "estimated_wait_remaining_minutes": 5,
    "service_category": "General Inquiry",
    "priority_level": 1,
    "priority_reason": null,
    "teller_id": 3,
    "teller_name": "Ahmed Hassan",
    "counter_id": 2,
    "counter_name": "Counter 2",
    "branch_id": 1,
    "branch_name": "Main Branch"
  },
  "public_safe": false
}
```

### Output Fields

**Public Fields** (visible to all):
- `ticket_number`, `display_code`, `status`
- `joined_at`, `called_at`, `service_started_at`
- `estimated_wait_remaining_minutes`
- `service_category`, `priority_level`

**Operations Only Fields** (hidden from public):
- `customer_name`, `customer_phone`
- `completed_at`
- `priority_reason`
- `teller_id`, `teller_name`
- `counter_id`, `counter_name`
- `branch_id`, `branch_name`

### When to Use

- Customer: "What is the status of my ticket?"
- Customer: "I have ticket ABC123, what's happening?"
- Staff: "Look up ticket B001"
- Manager: "Show me details on ticket ID 456"

---

## Tool 3: branch.load

Analyze branch capacity - how many counters are available, service categories, and load analysis.

### Purpose
- Capacity planning
- Load balancing decisions
- Branch health monitoring

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `branch_id` | integer | Optional | Specific branch (managers restricted to own) |

### Input Example

```json
{
  "branch_id": 1
}
```

### Output Format

```json
{
  "data": {
    "branch_id": 1,
    "branch_name": "Main Branch",
    "total_counters": 5,
    "active_counters": 4,
    "inactive_counters": 1,
    "service_categories": [
      {
        "id": 1,
        "name": "General Inquiry",
        "code": "GEN",
        "estimated_service_minutes": 5,
        "current_wait_queue": 3
      },
      {
        "id": 2,
        "name": "Premium Service",
        "code": "PREM",
        "estimated_service_minutes": 10,
        "current_wait_queue": 1
      }
    ],
    "capacity_utilization_percent": 75,
    "estimated_queue_clear_minutes": 18,
    "timestamp": "2026-05-12T10:30:00Z"
  },
  "public_safe": true
}
```

### Output Fields

| Field | Type | Description |
|-------|------|-------------|
| `branch_id` | integer | Branch ID |
| `branch_name` | string | Branch name |
| `total_counters` | integer | Total counters at branch |
| `active_counters` | integer | Currently staffed counters |
| `inactive_counters` | integer | Unstaffed counters |
| `service_categories` | array | List of service categories |
| `service_categories[].id` | integer | Category ID |
| `service_categories[].name` | string | Category name |
| `service_categories[].estimated_service_minutes` | integer | Average service time |
| `service_categories[].current_wait_queue` | integer | Tickets waiting for this service |
| `capacity_utilization_percent` | integer | % of capacity in use (0-100) |
| `estimated_queue_clear_minutes` | integer | Est. minutes to clear all queues |

### When to Use

- Manager: "What is the branch capacity?"
- Staff: "Are there open counters?"
- Manager: "Show me branch load analysis"

---

## Tool 4: counters.status

Get list of active counters and their current assignments.

### Purpose
- Real-time counter assignments
- Teller workload visibility
- Capacity monitoring

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `branch_id` | integer | Optional | Filter by branch |
| `active_only` | boolean | Optional | Show only active counters (default: true) |

### Input Example

```json
{
  "branch_id": 1,
  "active_only": true
}
```

### Output Format

```json
{
  "data": {
    "counters": [
      {
        "id": 1,
        "name": "Counter 1",
        "code": "C1",
        "branch_id": 1,
        "branch_name": "Main Branch",
        "is_active": true,
        "assigned_teller_id": 3,
        "assigned_teller_name": "Ahmed Hassan",
        "current_ticket_id": 15,
        "current_ticket_number": "ABC015",
        "current_ticket_service_minutes": 3
      },
      {
        "id": 2,
        "name": "Counter 2",
        "code": "C2",
        "branch_id": 1,
        "branch_name": "Main Branch",
        "is_active": true,
        "assigned_teller_id": 5,
        "assigned_teller_name": "Fatima Ali",
        "current_ticket_id": 18,
        "current_ticket_number": "ABC018",
        "current_ticket_service_minutes": 7
      }
    ],
    "active_counter_count": 2,
    "total_counter_count": 5,
    "timestamp": "2026-05-12T10:30:00Z"
  },
  "public_safe": true
}
```

### Output Fields

| Field | Type | Description |
|-------|------|-------------|
| `counters` | array | List of counter objects |
| `counters[].id` | integer | Counter ID |
| `counters[].name` | string | Counter name |
| `counters[].code` | string | Counter code |
| `counters[].branch_id` | integer | Branch ID |
| `counters[].is_active` | boolean | Whether counter is staffed |
| `counters[].assigned_teller_id` | integer | Assigned teller ID (if active) |
| `counters[].assigned_teller_name` | string | Assigned teller name |
| `counters[].current_ticket_id` | integer | ID of ticket being served |
| `counters[].current_ticket_number` | string | Ticket number being served |
| `counters[].current_ticket_service_minutes` | integer | Minutes spent on current ticket |
| `active_counter_count` | integer | Number of active counters |
| `total_counter_count` | integer | Total counters |

### When to Use

- Teller: "Which counters are available?"
- Manager: "Show me active counters"
- Staff: "Who is working at which counter?"

---

## Tool 5: delay.explain

Analyze why the queue is delayed - what factors contribute to wait times.

### Purpose
- Root cause analysis
- Performance monitoring
- SLA tracking

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `branch_id` | integer | Optional | Analyze specific branch |
| `time_period` | string | Optional | "today", "this_week" (default: "today") |

### Input Example

```json
{
  "branch_id": 1,
  "time_period": "today"
}
```

### Output Format

```json
{
  "data": {
    "queue_delay_factors": [
      {
        "factor": "High service time for premium tickets",
        "impact_minutes": 8,
        "tickets_affected": 5,
        "mitigation": "Consider adding dedicated counter for premium service"
      },
      {
        "factor": "Insufficient staff coverage 10am-12pm",
        "impact_minutes": 15,
        "tickets_affected": 12,
        "mitigation": "Schedule more tellers during peak hours"
      },
      {
        "factor": "Complex customer inquiries",
        "impact_minutes": 5,
        "tickets_affected": 3,
        "mitigation": "Provide teller training on common issues"
      }
    ],
    "current_average_wait": 12,
    "service_level_agreement_target": 10,
    "performance_vs_sla": "Below target (2 min delay)",
    "timestamp": "2026-05-12T10:30:00Z"
  },
  "public_safe": true
}
```

### Output Fields

| Field | Type | Description |
|-------|------|-------------|
| `queue_delay_factors` | array | Root causes of delays |
| `queue_delay_factors[].factor` | string | Description of delay factor |
| `queue_delay_factors[].impact_minutes` | integer | Minutes added to wait time |
| `queue_delay_factors[].tickets_affected` | integer | Number of tickets impacted |
| `queue_delay_factors[].mitigation` | string | Suggested fix |
| `current_average_wait` | integer | Current avg wait in minutes |
| `service_level_agreement_target` | integer | SLA target in minutes |
| `performance_vs_sla` | string | Performance narrative |
| `timestamp` | string | Analysis time (ISO 8601) |

### When to Use

- Manager: "Why is the queue so slow?"
- Supervisor: "What's causing the delay?"
- Manager: "Performance analysis"
- Staff: "Why are wait times high?"

---

## Tool 6: policy.read

Read current queue operation policies and configuration.

### Purpose
- Policy verification
- Training reference
- Compliance documentation

### Parameters

No parameters.

### Input Example

```json
{}
```

### Output Format

```json
{
  "data": {
    "policies": {
      "max_waiting_time_minutes": 45,
      "priority_escalation_minutes": 15,
      "priority_categories": [
        {
          "level": 1,
          "name": "Standard",
          "served_before_next_higher": true
        },
        {
          "level": 2,
          "name": "Priority",
          "reason": "Elderly, disabled, pregnant"
        },
        {
          "level": 3,
          "name": "VIP",
          "reason": "Premium customers"
        }
      ],
      "service_hours": {
        "monday_friday": "08:00-17:00",
        "saturday": "08:00-14:00",
        "sunday": "Closed"
      },
      "peak_hours": "10:00-12:00, 14:00-16:00",
      "staff_break_policy": "Rotating 30-min breaks, minimum 1 teller per counter",
      "customer_communication": "SMS updates for tickets with >20 min wait",
      "sla_target_minutes": 10
    },
    "last_updated": "2026-05-01T00:00:00Z"
  },
  "public_safe": true
}
```

### Output Fields

| Field | Type | Description |
|-------|------|-------------|
| `policies` | object | Policy configuration |
| `policies.max_waiting_time_minutes` | integer | Maximum acceptable wait |
| `policies.priority_escalation_minutes` | integer | Minutes before escalation |
| `policies.priority_categories` | array | Priority level definitions |
| `policies.service_hours` | object | Operating hours by day |
| `policies.peak_hours` | string | Peak operation times |
| `policies.staff_break_policy` | string | Break rotation rules |
| `policies.customer_communication` | string | Notification policy |
| `policies.sla_target_minutes` | integer | Service level agreement target |
| `last_updated` | string | Last policy update (ISO 8601) |

### When to Use

- Customer: "What are the operating hours?"
- Staff: "What is the break policy?"
- Manager: "Show me the SLA target"
- Training: "What are the priority rules?"

---

## Tool 7: reports.summary

Generate daily or weekly statistics (Manager+ only).

### Purpose
- Performance reporting
- Trend analysis
- Management dashboards

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | Optional | "daily" (default) or "weekly" |
| `branch_id` | integer | Optional | Specific branch (managers limited to own) |
| `include_metrics` | array | Optional | Specific metrics to include |

### Input Example

```json
{
  "period": "daily",
  "branch_id": 1
}
```

### Output Format (Daily)

```json
{
  "data": {
    "period": "2026-05-12",
    "period_type": "daily",
    "branch_id": 1,
    "branch_name": "Main Branch",
    "metrics": {
      "tickets_processed": 142,
      "tickets_completed": 135,
      "tickets_cancelled": 4,
      "tickets_missed": 3,
      "average_service_time_minutes": 8.5,
      "average_wait_time_minutes": 12,
      "max_wait_time_minutes": 52,
      "sla_compliance_percent": 85,
      "peak_hour": "11:00",
      "peak_hour_tickets": 28,
      "total_staff_hours": 40,
      "busiest_service_category": "General Inquiry (64 tickets)"
    },
    "trends": {
      "vs_yesterday": "15% more tickets",
      "vs_last_week_same_day": "5% fewer wait times",
      "weekly_trend": "↑ Slightly increasing"
    },
    "top_bottlenecks": [
      "Premium Service queue (avg 18 min wait)",
      "11am-1pm peak hours",
      "Insufficient coverage 2pm-3pm"
    ]
  },
  "public_safe": false
}
```

### Output Format (Weekly)

```json
{
  "data": {
    "period": "2026-05-06 to 2026-05-12",
    "period_type": "weekly",
    "branch_id": 1,
    "branch_name": "Main Branch",
    "metrics": {
      "tickets_processed": 847,
      "tickets_completed": 815,
      "tickets_cancelled": 22,
      "tickets_missed": 10,
      "average_service_time_minutes": 8.2,
      "average_wait_time_minutes": 11.5,
      "max_wait_time_minutes": 68,
      "sla_compliance_percent": 88,
      "busiest_day": "Wednesday",
      "quietest_day": "Saturday",
      "average_daily_tickets": 121
    },
    "daily_breakdown": [
      {"day": "Monday", "tickets": 135, "avg_wait": 10},
      {"day": "Tuesday", "tickets": 128, "avg_wait": 12},
      {"day": "Wednesday", "tickets": 156, "avg_wait": 14},
      {"day": "Thursday", "tickets": 142, "avg_wait": 11},
      {"day": "Friday", "tickets": 149, "avg_wait": 13},
      {"day": "Saturday", "tickets": 89, "avg_wait": 8},
      {"day": "Sunday", "tickets": 0, "avg_wait": 0}
    ]
  },
  "public_safe": false
}
```

### Output Fields

| Field | Type | Description |
|-------|------|-------------|
| `period` | string | Date or date range |
| `period_type` | string | "daily" or "weekly" |
| `branch_id` | integer | Branch ID |
| `metrics` | object | Statistical metrics |
| `metrics.tickets_processed` | integer | Total tickets served |
| `metrics.average_service_time_minutes` | number | Avg service duration |
| `metrics.average_wait_time_minutes` | number | Avg customer wait |
| `metrics.sla_compliance_percent` | integer | % meeting SLA target |
| `trends` | object | Trend comparisons |
| `top_bottlenecks` | array | Identified issues |

### When to Use

- Manager: "Show me today's statistics"
- Manager: "Weekly report"
- Supervisor: "Performance metrics"
- Executive: "Branch performance analysis"

---

## Error Handling

### Tool Execution Errors

When a tool fails, the response will show:
```json
{
  "tool": "queue.status",
  "status": "failed",
  "error": "Database query timeout"
}
```

### Authorization Denials

When a user lacks permission:
```json
{
  "tool": "reports.summary",
  "status": "denied",
  "reason": "Tellers cannot access reports"
}
```

### Input Validation Errors

When input is invalid:
```json
{
  "tool": "ticket.status",
  "status": "failed",
  "error": "ticket_code is required"
}
```

---

## Tool Chaining

The assistant can call multiple tools in one request. For example:
- "Show me queue status and why it's slow" → calls `queue.status` + `delay.explain`
- "What's my ticket status and when will I be served?" → calls `ticket.status` + `branch.load`
- "Branch capacity and active counters" → calls `branch.load` + `counters.status`

Each tool execution is logged separately in `toolResults` array.
