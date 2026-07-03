# Entity Relationship Diagram (ERD)

This document describes the relational database schema design for the **Umiya Bachat Mandal** application.

```mermaid
erDiagram
    members ||--o{ loans : "has"
    members ||--o{ payments : "makes"
    loans ||--o{ repayments : "repays"
    members ||--o{ member_access : "credentials"
    dividends {
        text id PK
        integer year
        timestamptz declared_date
        numeric total_amount
        numeric per_share
        integer total_shares
        jsonb members_snapshot
        timestamptz updated_at
    }
    settings {
        integer id PK
        numeric share_val
        numeric joining_fee
        numeric monthly_fee
        numeric interest_rate
        integer collection_day
        timestamptz updated_at
    }
    activity_log {
        text id PK
        text msg
        timestamptz created_at
    }
    members {
        text id PK
        integer num UK
        text name
        text phone
        integer shares
        text address
        boolean joining_paid
        timestamptz joined_date
        timestamptz updated_at
    }
    loans {
        text id PK
        text member_id FK
        numeric amount
        numeric rate
        integer duration
        text type
        text status
        numeric emi
        numeric principal_paid
        numeric interest_paid
        jsonb guarantors
        timestamptz updated_at
    }
    payments {
        text id PK
        text member_id FK
        text month
        numeric amount
        timestamptz paid_date
        timestamptz updated_at
    }
    repayments {
        text id PK
        text loan_id FK
        text month
        timestamptz paid_date
        numeric amount
        numeric principal
        numeric interest
        timestamptz updated_at
    }
    member_access {
        text id PK
        text member_id FK
        uuid supabase_uid
        integer member_num
        text fcm_token
        timestamptz last_login
        timestamptz created_at
    }
```

## Schema Details & Constraints

1. **`members`**: Holds information about each member.
   * `num` has a `UNIQUE` constraint to guarantee sequence integrity.
2. **`loans`**: Holds information about loans granted to members.
   * `member_id` is a Foreign Key referencing `members(id)`.
   * Has a `CHECK` constraint restricting types to `FLAT_EMI` and `INTEREST_ONLY`.
3. **`payments`**: Records monthly savings contributions (Hato).
   * `member_id` is a Foreign Key referencing `members(id)`.
4. **`repayments`**: Records EMI payments against specific loans.
   * `loan_id` is a Foreign Key referencing `loans(id)`.
5. **`member_access`**: Links Supabase authentication users (`auth.users`) to application members.
   * `member_id` is a Foreign Key referencing `members(id)` with a `UNIQUE` constraint (1-to-1 relationship).
6. **`settings`**: Single-row configuration table.
   * The `id` is primary key defaulted to `1` with an implicit constraint restricting it to exactly one row.
