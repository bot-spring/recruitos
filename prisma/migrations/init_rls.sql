-- -----------------------------------------------------------------------------
-- RECRUITOS ROW LEVEL SECURITY (RLS) INITIALIZATION SCRIPT (SUPABASE / POSTGRESQL)
-- -----------------------------------------------------------------------------

-- 1. Enable Row Level Security on multi-tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_submissions ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS Policy for Users table
DROP POLICY IF EXISTS tenant_isolation_policy_users ON users;
CREATE POLICY tenant_isolation_policy_users ON users
    USING (
        agency_id IS NULL 
        OR agency_id = NULLIF(current_setting('app.current_agency_id', true), '')
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- 3. Create RLS Policy for Audit Logs table
DROP POLICY IF EXISTS tenant_isolation_policy_audit ON audit_logs;
CREATE POLICY tenant_isolation_policy_audit ON audit_logs
    USING (
        agency_id IS NULL 
        OR agency_id = NULLIF(current_setting('app.current_agency_id', true), '')
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- 4. Create RLS Policy for Client Accounts table
DROP POLICY IF EXISTS tenant_isolation_policy_clients ON client_accounts;
CREATE POLICY tenant_isolation_policy_clients ON client_accounts
    USING (
        agency_id = NULLIF(current_setting('app.current_agency_id', true), '')
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- 5. Create RLS Policy for Client Contacts table
DROP POLICY IF EXISTS tenant_isolation_policy_contacts ON client_contacts;
CREATE POLICY tenant_isolation_policy_contacts ON client_contacts
    USING (
        agency_id = NULLIF(current_setting('app.current_agency_id', true), '')
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- 6. Create RLS Policy for Job Mandates table
DROP POLICY IF EXISTS tenant_isolation_policy_mandates ON job_mandates;
CREATE POLICY tenant_isolation_policy_mandates ON job_mandates
    USING (
        agency_id = NULLIF(current_setting('app.current_agency_id', true), '')
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- 7. Create RLS Policy for Job Broadcasts table
DROP POLICY IF EXISTS tenant_isolation_policy_broadcasts ON job_broadcasts;
CREATE POLICY tenant_isolation_policy_broadcasts ON job_broadcasts
    USING (
        agency_id = NULLIF(current_setting('app.current_agency_id', true), '')
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- 8. Create RLS Policy for Partner Shares table
DROP POLICY IF EXISTS tenant_isolation_policy_partner_shares ON partner_shares;
CREATE POLICY tenant_isolation_policy_partner_shares ON partner_shares
    USING (
        agency_id = NULLIF(current_setting('app.current_agency_id', true), '')
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- 9. Create RLS Policy for Candidates table
DROP POLICY IF EXISTS tenant_isolation_policy_candidates ON candidates;
CREATE POLICY tenant_isolation_policy_candidates ON candidates
    USING (
        agency_id = NULLIF(current_setting('app.current_agency_id', true), '')
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- 10. Create RLS Policy for Candidate Submissions table
DROP POLICY IF EXISTS tenant_isolation_policy_submissions ON candidate_submissions;
CREATE POLICY tenant_isolation_policy_submissions ON candidate_submissions
    USING (
        agency_id = NULLIF(current_setting('app.current_agency_id', true), '')
        OR current_setting('app.is_super_admin', true) = 'true'
    );
