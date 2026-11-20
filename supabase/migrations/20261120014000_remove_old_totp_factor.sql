-- Remove one verified TOTP factor so its owner can enrol again. It was set up while the
-- authenticator issuer still read "localhost:3000"; the new enrolment uses the club name.
-- Selected by id, never by email, because the repository is public. Harmless when the row is
-- already gone.

delete from auth.mfa_factors
where id = '0bf035e5-350a-4600-9f46-c50fb9722127';
