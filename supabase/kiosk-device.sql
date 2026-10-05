BEGIN;
CREATE TABLE IF NOT EXISTS recycle_private.kiosk_devices(token_hash text PRIMARY KEY,operator_student_id varchar(5) NOT NULL REFERENCES public.students(student_id),enabled boolean NOT NULL DEFAULT true);
ALTER TABLE recycle_private.kiosk_devices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recycle_private.kiosk_devices FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.kiosk_device_api(p_device_token text,p_request jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE identity text;
BEGIN
  IF p_device_token IS NULL OR p_device_token !~ '^[0-9a-f]{64}$' OR p_request IS NULL OR octet_length(p_request::text)>32768 THEN RAISE EXCEPTION 'Device authentication required' USING ERRCODE='28000'; END IF;
  SELECT s.line_user_id INTO identity FROM recycle_private.kiosk_devices d JOIN public.students s ON s.student_id=d.operator_student_id
    WHERE d.token_hash=encode(sha256(convert_to(p_device_token,'UTF8')),'hex') AND d.enabled AND s.is_council_member IS TRUE;
  IF identity IS NULL THEN RAISE EXCEPTION 'Device not registered' USING ERRCODE='28000'; END IF;
  IF ((p_request->>'operation'='select' AND p_request->>'table'='students' AND p_request->>'single'='true'
    AND jsonb_array_length(p_request->'filters')=1 AND p_request->'filters'->0->>'column'='student_id'
    AND p_request->'filters'->0->>'op'='eq' AND p_request->'filters'->0->>'value' ~ '^[0-9]{5}$')
    OR (p_request->>'operation'='rpc' AND p_request->>'name'='credit_recycle_batch')) IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'Unsupported device operation' USING ERRCODE='42501'; END IF;
  RETURN recycle_private.dispatch(identity,p_request);
END;
$$;
REVOKE ALL ON FUNCTION public.kiosk_device_api(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kiosk_device_api(text,jsonb) TO anon;
COMMIT;
