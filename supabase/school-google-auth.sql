BEGIN;
CREATE TABLE IF NOT EXISTS recycle_private.school_identities (
  line_user_id text PRIMARY KEY,
  student_id varchar(5) NOT NULL UNIQUE REFERENCES public.students(student_id),
  auth_user_id uuid NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  verified_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE recycle_private.school_identities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recycle_private.school_identities FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION recycle_private.bind_school_google(identity text, access_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE response extensions.http_response; account jsonb; google_identity jsonb;
  school_email text; target text; existing_line text; existing_student text;
BEGIN
  IF access_token IS NULL OR length(access_token) NOT BETWEEN 50 AND 8192 THEN
    RAISE EXCEPTION 'กรุณาเข้าสู่ระบบ Google ของโรงเรียน' USING ERRCODE='28000';
  END IF;
  PERFORM set_config('http.curlopt_timeout_ms','4000',true);
  SELECT * INTO response FROM extensions.http((
    'GET','https://socuwjwndvbfjxafnolx.supabase.co/auth/v1/user',
    ARRAY[extensions.http_header('apikey','sb_publishable_QiQcTPtswW_T3TrnSVWxeQ_mFF5-5Iw'),
      extensions.http_header('Authorization','Bearer ' || access_token)],NULL,NULL
  )::extensions.http_request);
  IF response.status <> 200 THEN RAISE EXCEPTION 'Google session หมดอายุ กรุณาล็อกอินใหม่' USING ERRCODE='28000'; END IF;
  account:=response.content::jsonb;
  SELECT item INTO google_identity FROM jsonb_array_elements(account->'identities') item
    WHERE item->>'provider'='google';
  school_email:=lower(google_identity->'identity_data'->>'email');
  IF google_identity IS NULL OR google_identity->'identity_data'->>'email_verified' IS DISTINCT FROM 'true'
     OR school_email IS NULL OR school_email !~ '^[0-9]{5}@sappha[.]ac[.]th$'
     OR lower(account->>'email') IS DISTINCT FROM school_email OR account->>'email_confirmed_at' IS NULL THEN
    RAISE EXCEPTION 'ต้องใช้บัญชี Google เลขประจำตัว 5 หลัก@sappha.ac.th ที่ยืนยันอีเมลแล้ว' USING ERRCODE='28000';
  END IF;
  target:=split_part(school_email,'@',1);
  PERFORM pg_advisory_xact_lock(hashtextextended(identity,1));
  SELECT line_user_id INTO existing_line FROM public.students WHERE student_id=target FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ไม่พบเลขประจำตัวในทะเบียนนักเรียน'; END IF;
  SELECT student_id INTO existing_student FROM public.students WHERE line_user_id=identity;
  IF (existing_line IS NOT NULL AND existing_line<>identity)
     OR (existing_student IS NOT NULL AND existing_student<>target) THEN
    RAISE EXCEPTION 'บัญชีถูกผูกกับนักเรียนอื่นแล้ว กรุณาติดต่อเจ้าหน้าที่' USING ERRCODE='42501';
  END IF;
  INSERT INTO recycle_private.school_identities(line_user_id,student_id,auth_user_id,email)
    VALUES(identity,target,(account->>'id')::uuid,school_email)
    ON CONFLICT(line_user_id) DO UPDATE SET verified_at=now()
    WHERE school_identities.student_id=EXCLUDED.student_id AND school_identities.auth_user_id=EXCLUDED.auth_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'บัญชี Google ไม่ตรงกับบัญชีที่ยืนยันไว้' USING ERRCODE='42501'; END IF;
  UPDATE public.students SET line_user_id=identity WHERE student_id=target;
  RETURN jsonb_build_object('data',jsonb_build_object('student_id',target,'email',school_email),'error',NULL);
END;
$$;
REVOKE ALL ON FUNCTION recycle_private.bind_school_google(text,text) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.secure_api(p_id_token text,p_request jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE identity text;
BEGIN
  IF p_request IS NULL OR octet_length(p_request::text)>32768 THEN RAISE EXCEPTION 'Invalid request'; END IF;
  identity:=recycle_private.line_identity(p_id_token);
  IF p_request->>'operation'='rpc' AND p_request->>'name'='verify_school_google' THEN
    RETURN recycle_private.bind_school_google(identity,p_request->'args'->>'p_access_token');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE line_user_id=identity AND is_council_member IS TRUE)
     AND NOT EXISTS (SELECT 1 FROM recycle_private.school_identities v JOIN public.students s USING(student_id)
       WHERE v.line_user_id=identity AND s.line_user_id=identity) THEN
    RAISE EXCEPTION 'กรุณายืนยันอีเมล Google ของโรงเรียนก่อนดูแต้ม' USING ERRCODE='42501';
  END IF;
  RETURN recycle_private.dispatch(identity,p_request);
END;
$$;
REVOKE ALL ON FUNCTION public.secure_api(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.secure_api(text,jsonb) TO anon,authenticated;
COMMIT;
