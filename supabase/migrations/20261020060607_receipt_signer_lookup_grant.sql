-- The receipt signer checks transaction ownership through the privileged Data API.
-- BYPASSRLS does not supply relation privileges; grant only the required read access.
grant select on public.financial_transactions to service_role;
