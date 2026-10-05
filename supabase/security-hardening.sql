-- Install as one transaction after deploying secure-client.js and the updated UI.
-- No browser contains a database secret. LINE verifies each ID token server-side.
BEGIN;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE SCHEMA IF NOT EXISTS recycle_private;
REVOKE ALL ON SCHEMA recycle_private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION recycle_private.line_identity(p_id_token text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE response extensions.http_response; claims jsonb;
BEGIN
  IF p_id_token IS NULL OR length(p_id_token) < 50 OR length(p_id_token) > 8192 THEN
    RAISE EXCEPTION 'LINE authentication required' USING ERRCODE='28000';
  END IF;
  PERFORM set_config('http.curlopt_timeout_ms', '4000', true);
  SELECT * INTO response FROM extensions.http_post(
    'https://api.line.me/oauth2/v2.1/verify',
    'id_token=' || extensions.urlencode(p_id_token) || '&client_id=2011161264',
    'application/x-www-form-urlencoded');
  IF response.status <> 200 THEN
    RAISE EXCEPTION 'Invalid or expired LINE token' USING ERRCODE='28000';
  END IF;
  claims := response.content::jsonb;
  IF claims->>'aud' IS DISTINCT FROM '2011161264'
     OR claims->>'iss' IS DISTINCT FROM 'https://access.line.me'
     OR coalesce((claims->>'exp')::bigint, 0) <= extract(epoch FROM now())
     OR coalesce(claims->>'sub', '') !~ '^U[0-9a-f]{32}$' THEN
    RAISE EXCEPTION 'Invalid LINE identity' USING ERRCODE='28000';
  END IF;
  RETURN claims->>'sub';
END;
$$;
REVOKE ALL ON FUNCTION recycle_private.line_identity(text) FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS recycle_private.deposit_receipts (
  request_id uuid PRIMARY KEY,
  operator_line_id text NOT NULL,
  student_id varchar(5) NOT NULL,
  pet_count integer NOT NULL,
  can_count integer NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE recycle_private.deposit_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recycle_private.deposit_receipts FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS recycle_private.binding_requests (
  line_user_id text PRIMARY KEY,
  student_id varchar(5) NOT NULL REFERENCES public.students(student_id),
  phone_number varchar(15),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE recycle_private.binding_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recycle_private.binding_requests FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION recycle_private.dispatch(p_line_user_id text, p_request jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  identity text; actor public.students%ROWTYPE; staff boolean; admin boolean;
  tbl text := p_request->>'table'; operation text := p_request->>'operation';
  name text; args jsonb; f jsonb; k text; value text; coltype text;
  predicate text := 'true'; ordering text := ''; assignments text := '';
  columns_sql text := ''; values_sql text := ''; rows jsonb; result jsonb;
  sql text; target text; lim integer; off integer; total bigint;
  pet integer; can integer; v_request_id uuid; receipt recycle_private.deposit_receipts%ROWTYPE;
BEGIN
  IF p_request IS NULL OR octet_length(p_request::text) > 32768 THEN RAISE EXCEPTION 'Invalid request'; END IF;
  identity := p_line_user_id;
  SELECT * INTO actor FROM public.students WHERE line_user_id = identity;
  IF operation = 'rpc' AND p_request->>'name' = 'request_account_binding' THEN
    IF actor.student_id IS NOT NULL THEN RAISE EXCEPTION 'บัญชีนี้ผูกกับนักเรียนแล้ว'; END IF;
    target := p_request->'args'->>'p_student_id';
    value := p_request->'args'->>'p_phone';
    IF target IS NULL OR target !~ '^\d{5}$' OR NOT EXISTS (SELECT 1 FROM public.students WHERE student_id=target)
      OR value IS NULL OR value !~ '^0[0-9]{9}$' THEN RAISE EXCEPTION 'กรุณาตรวจสอบรหัสนักเรียนและเบอร์โทร'; END IF;
    INSERT INTO recycle_private.binding_requests(line_user_id,student_id,phone_number)
    VALUES(identity,target,value) ON CONFLICT (line_user_id) DO UPDATE
    SET student_id=EXCLUDED.student_id,phone_number=EXCLUDED.phone_number,created_at=now();
    RETURN jsonb_build_object('data',jsonb_build_object('pending',true),'error',NULL);
  END IF;
  IF actor.student_id IS NULL THEN RAISE EXCEPTION 'บัญชี LINE ยังไม่ได้รับการผูกกับนักเรียน กรุณาติดต่อเจ้าหน้าที่' USING ERRCODE='42501'; END IF;
  staff := actor.is_council_member IS TRUE;
  admin := staff AND actor.student_id = '32650';
  IF operation = 'rpc' THEN
    name := p_request->>'name'; args := p_request->'args';
    IF name = 'list_binding_requests' THEN
      IF NOT admin THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
      SELECT coalesce(jsonb_agg(to_jsonb(b) || jsonb_build_object('full_name',s.full_name,'room',s.room)), '[]')
      INTO result FROM recycle_private.binding_requests b JOIN public.students s USING(student_id);
    ELSIF name = 'approve_account_binding' THEN
      IF NOT admin THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
      SELECT b.student_id INTO target FROM recycle_private.binding_requests b
      WHERE b.line_user_id=args->>'p_line_user_id' FOR UPDATE;
      IF target IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
      PERFORM 1 FROM public.students WHERE student_id=target FOR UPDATE;
      IF EXISTS (SELECT 1 FROM public.students WHERE student_id=target AND line_user_id IS NOT NULL AND line_user_id<>args->>'p_line_user_id') THEN RAISE EXCEPTION 'นักเรียนนี้ผูกกับบัญชีอื่นแล้ว'; END IF;
      UPDATE public.students s SET line_user_id=b.line_user_id,phone_number=coalesce(nullif(s.phone_number,''),b.phone_number)
      FROM recycle_private.binding_requests b WHERE s.student_id=target AND b.line_user_id=args->>'p_line_user_id';
      DELETE FROM recycle_private.binding_requests WHERE line_user_id=args->>'p_line_user_id';
      result:=jsonb_build_object('success',true);
    ELSIF name = 'credit_recycle_batch' THEN
      IF NOT staff THEN RAISE EXCEPTION 'Staff authentication required' USING ERRCODE='42501'; END IF;
      pet := (args->>'p_pet_count')::integer; can := (args->>'p_can_count')::integer;
      target := args->>'p_student_id'; v_request_id := (args->>'p_request_id')::uuid;
      IF v_request_id IS NULL OR target IS NULL OR target !~ '^\d{5}$' OR pet IS NULL OR can IS NULL OR pet < 0 OR can < 0 OR pet+can NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Invalid deposit'; END IF;
      PERFORM pg_advisory_xact_lock(hashtextextended(v_request_id::text, 0));
      SELECT * INTO receipt FROM recycle_private.deposit_receipts WHERE deposit_receipts.request_id = v_request_id;
      IF FOUND THEN
        IF receipt.operator_line_id <> identity OR receipt.student_id <> target OR receipt.pet_count <> pet OR receipt.can_count <> can THEN RAISE EXCEPTION 'Session mismatch'; END IF;
        RETURN jsonb_build_object('data', receipt.result, 'error', NULL);
      END IF;
      result := public.credit_recycle_batch(target::varchar, pet, can)::jsonb;
      IF result->>'success' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Deposit not confirmed'; END IF;
      INSERT INTO recycle_private.deposit_receipts VALUES (v_request_id, identity, target, pet, can, result, now());
    ELSIF name = 'redeem_reward_coupon' THEN
      IF args->>'p_student_id' IS DISTINCT FROM actor.student_id THEN RAISE EXCEPTION 'Owner mismatch' USING ERRCODE='42501'; END IF;
      PERFORM 1 FROM public.students WHERE student_id=actor.student_id FOR UPDATE;
      PERFORM 1 FROM public.rewards WHERE reward_id=(args->>'p_reward_id')::uuid FOR UPDATE;
      result := public.redeem_reward_coupon(actor.student_id, (args->>'p_reward_id')::uuid, (args->>'p_coupon_code')::varchar)::jsonb;
    ELSIF name = 'confirm_coupon_handover' THEN
      IF NOT staff THEN RAISE EXCEPTION 'Council authentication required' USING ERRCODE='42501'; END IF;
      PERFORM 1 FROM public.coupons WHERE coupon_code=args->>'p_coupon_code' FOR UPDATE;
      result := public.confirm_coupon_handover((args->>'p_coupon_code')::varchar, identity::varchar)::jsonb;
    ELSE RAISE EXCEPTION 'Unsupported operation'; END IF;
    RETURN jsonb_build_object('data', result, 'error', NULL);
  END IF;

  IF tbl IS NULL OR tbl NOT IN ('students','coupons','rewards','recycle_logs') OR operation IS NULL OR operation NOT IN ('select','update','insert','delete') THEN RAISE EXCEPTION 'Unsupported operation'; END IF;
  IF NOT admin THEN
    IF operation = 'select' THEN
      IF tbl IN ('students','coupons','recycle_logs') AND NOT staff THEN predicate := format('t.student_id = %L', actor.student_id); END IF;
      IF tbl = 'rewards' THEN predicate := 't.is_active = true'; END IF;
    ELSIF operation = 'update' AND tbl = 'students' THEN
      IF NOT staff THEN predicate := format('t.student_id = %L', actor.student_id); END IF;
      IF p_request->'values' IS NULL OR ((p_request->'values') - 'phone_number' - 'updated_at') <> '{}'::jsonb THEN RAISE EXCEPTION 'Only phone changes are allowed' USING ERRCODE='42501'; END IF;
    ELSE RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  END IF;
  IF operation <> 'select' AND operation <> 'insert' AND jsonb_array_length(coalesce(p_request->'filters','[]')) = 0 THEN RAISE EXCEPTION 'A target is required'; END IF;
  FOR f IN SELECT * FROM jsonb_array_elements(coalesce(p_request->'filters','[]')) LOOP
    k := f->>'column';
    IF k IS NULL OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name=k) THEN RAISE EXCEPTION 'Invalid filter'; END IF;
    IF f->>'op' = 'eq' THEN predicate := predicate || format(' AND t.%I = %L', k, f->>'value');
    ELSIF f->>'op' = 'ilike' THEN predicate := predicate || format(' AND t.%I::text ILIKE %L', k, f->>'value');
    ELSE RAISE EXCEPTION 'Invalid filter'; END IF;
  END LOOP;
  IF operation = 'select' THEN
    lim := least(greatest(coalesce((p_request->>'limit')::integer,1000),1),3000);
    off := greatest(coalesce((p_request->>'offset')::integer,0),0);
    k := p_request->>'order';
    IF k IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name=k) THEN RAISE EXCEPTION 'Invalid order'; END IF;
      ordering := format(' ORDER BY t.%I %s', k, CASE WHEN p_request->>'ascending'='false' THEN 'DESC' ELSE 'ASC' END);
    END IF;
    sql := format('SELECT to_jsonb(t) AS value FROM public.%I t WHERE %s%s LIMIT %s OFFSET %s', tbl, predicate, ordering, lim, off);
    IF tbl = 'coupons' THEN
      sql := format('SELECT to_jsonb(t) || jsonb_build_object(''rewards'', (SELECT to_jsonb(r) FROM public.rewards r WHERE r.reward_id=t.reward_id), ''students'', (SELECT jsonb_build_object(''full_name'',s.full_name,''room'',s.room,''no'',s.no) FROM public.students s WHERE s.student_id=t.student_id)) AS value FROM public.coupons t WHERE %s%s LIMIT %s OFFSET %s', predicate, ordering, lim, off);
    ELSIF tbl = 'recycle_logs' AND staff THEN
      sql := format('SELECT to_jsonb(t) || jsonb_build_object(''students'', (SELECT jsonb_build_object(''full_name'',s.full_name,''room'',s.room,''no'',s.no) FROM public.students s WHERE s.student_id=t.student_id)) AS value FROM public.recycle_logs t WHERE %s%s LIMIT %s OFFSET %s', predicate, ordering, lim, off);
    END IF;
    EXECUTE 'SELECT coalesce(jsonb_agg(value),''[]''::jsonb) FROM (' || sql || ') q' INTO rows;
    EXECUTE format('SELECT count(*) FROM public.%I t WHERE %s', tbl, predicate) INTO total;
  ELSE
    IF operation IN ('update','insert') THEN
      IF jsonb_typeof(p_request->'values') <> 'object' THEN RAISE EXCEPTION 'Invalid values'; END IF;
      FOR k,value IN SELECT key, val FROM jsonb_each_text(p_request->'values') AS v(key,val) LOOP
        IF k IN ('updated_at') THEN CONTINUE; END IF;
        IF (tbl='students' AND k NOT IN ('phone_number','current_points','line_user_id')) OR tbl='recycle_logs' THEN RAISE EXCEPTION 'Protected column'; END IF;
        SELECT format_type(a.atttypid,a.atttypmod) INTO coltype FROM pg_attribute a WHERE a.attrelid=format('public.%I',tbl)::regclass AND a.attname=k AND a.attnum>0 AND NOT a.attisdropped;
        IF coltype IS NULL THEN RAISE EXCEPTION 'Invalid column'; END IF;
        IF assignments <> '' THEN assignments:=assignments||','; columns_sql:=columns_sql||','; values_sql:=values_sql||','; END IF;
        assignments:=assignments||format('%I=%L::%s',k,value,coltype);
        columns_sql:=columns_sql||format('%I',k); values_sql:=values_sql||format('%L::%s',value,coltype);
      END LOOP;
      IF assignments='' THEN RAISE EXCEPTION 'Empty values'; END IF;
    END IF;
    IF operation='update' THEN sql:=format('UPDATE public.%I t SET %s WHERE %s RETURNING to_jsonb(t) AS value',tbl,assignments,predicate);
    ELSIF operation='insert' THEN sql:=format('INSERT INTO public.%I AS t (%s) VALUES (%s) RETURNING to_jsonb(t) AS value',tbl,columns_sql,values_sql);
    ELSE sql:=format('DELETE FROM public.%I t WHERE %s RETURNING to_jsonb(t) AS value',tbl,predicate); END IF;
    EXECUTE 'WITH changed AS (' || sql || ') SELECT coalesce(jsonb_agg(value),''[]''::jsonb) FROM changed' INTO rows;
    total:=jsonb_array_length(rows);
  END IF;
  IF p_request->>'single' = 'true' THEN
    IF jsonb_array_length(rows)>1 OR (jsonb_array_length(rows)=0 AND p_request->>'optional' IS DISTINCT FROM 'true') THEN RAISE EXCEPTION 'Expected one record'; END IF;
    rows:=rows->0;
  END IF;
  RETURN jsonb_build_object('data', rows, 'error', NULL, 'count', total);
END;
$$;
REVOKE ALL ON FUNCTION recycle_private.dispatch(text,jsonb) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.secure_api(p_id_token text, p_request jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_request IS NULL OR octet_length(p_request::text) > 32768 THEN RAISE EXCEPTION 'Invalid request'; END IF;
  RETURN recycle_private.dispatch(recycle_private.line_identity(p_id_token), p_request);
END;
$$;
REVOKE ALL ON FUNCTION public.secure_api(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.secure_api(text,jsonb) TO anon, authenticated;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycle_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.students,public.coupons,public.rewards,public.recycle_logs FROM PUBLIC,anon,authenticated,service_role;
REVOKE EXECUTE ON FUNCTION public.credit_recycle_batch(varchar,integer,integer) FROM PUBLIC,anon,authenticated,service_role;
REVOKE EXECUTE ON FUNCTION public.redeem_reward_coupon(varchar,uuid,varchar) FROM PUBLIC,anon,authenticated,service_role;
REVOKE EXECUTE ON FUNCTION public.confirm_coupon_handover(varchar,varchar) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
