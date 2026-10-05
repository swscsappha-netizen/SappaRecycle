BEGIN;
DO $$
DECLARE rejected boolean:=false;
BEGIN
  BEGIN
    PERFORM recycle_private.bind_school_google('U00000000000000000000000000000000',repeat('x',80));
  EXCEPTION WHEN invalid_authorization_specification THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Invalid Google session was accepted'; END IF;
  IF has_function_privilege('anon','recycle_private.bind_school_google(text,text)','EXECUTE')
     OR has_table_privilege('anon','recycle_private.school_identities','SELECT') THEN
    RAISE EXCEPTION 'Private identity access leaked';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='recycle_private.school_identities'::regclass) THEN
    RAISE EXCEPTION 'School identity RLS disabled';
  END IF;
  IF position('กรุณายืนยันอีเมล Google' in pg_get_functiondef('public.secure_api(text,jsonb)'::regprocedure))=0 THEN
    RAISE EXCEPTION 'School verification gate missing';
  END IF;
END;
$$;
SELECT 'PASS: invalid Google token rejected; private identity permissions and RLS secured; school gate installed' AS result;
ROLLBACK;
