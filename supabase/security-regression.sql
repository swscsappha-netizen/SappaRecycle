-- Run in SQL Editor as the database owner. All fixture writes are rolled back.
BEGIN;
DO $$
DECLARE result jsonb; denied boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM public.students WHERE student_id IN ('00000','00001','00002')) THEN
    RAISE EXCEPTION 'Fixture IDs already exist; do not modify existing students';
  END IF;
  INSERT INTO public.students(student_id,full_name,room,line_user_id,current_points,is_council_member)
  VALUES ('00000','Security QA owner','QA','U00000000000000000000000000000000',140,false),
         ('00001','Security QA other','QA','U11111111111111111111111111111111',50,false),
         ('00002','Security QA staff','QA','U22222222222222222222222222222222',0,true);

  result := recycle_private.dispatch('U00000000000000000000000000000000',
    '{"table":"students","operation":"select","filters":[],"single":true}');
  IF result->'data'->>'student_id' <> '00000' THEN RAISE EXCEPTION 'Owner isolation failed'; END IF;
  result := recycle_private.dispatch('U00000000000000000000000000000000',
    '{"table":"students","operation":"select","filters":[{"column":"student_id","op":"eq","value":"00001"}]}');
  IF result->'data' <> '[]'::jsonb THEN RAISE EXCEPTION 'Other student data leaked'; END IF;

  denied := false;
  BEGIN
    PERFORM recycle_private.dispatch('U00000000000000000000000000000000',
      '{"table":"students","operation":"update","filters":[{"column":"student_id","op":"eq","value":"00000"}],"values":{"current_points":999}}');
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Student changed own points'; END IF;

  denied := false;
  BEGIN
    PERFORM recycle_private.dispatch('U00000000000000000000000000000000',
      '{"operation":"rpc","name":"credit_recycle_batch","args":{"p_student_id":"00000","p_pet_count":1,"p_can_count":1,"p_request_id":"00000000-0000-4000-8000-000000000001"}}');
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Student credited own points'; END IF;

  result := recycle_private.dispatch('U22222222222222222222222222222222',
    '{"operation":"rpc","name":"credit_recycle_batch","args":{"p_student_id":"00000","p_pet_count":1,"p_can_count":1,"p_request_id":"00000000-0000-4000-8000-000000000001"}}');
  IF (result->'data'->>'current_points')::int <> 170 THEN RAISE EXCEPTION 'Wrong credited balance'; END IF;
  PERFORM recycle_private.dispatch('U22222222222222222222222222222222',
    '{"operation":"rpc","name":"credit_recycle_batch","args":{"p_student_id":"00000","p_pet_count":1,"p_can_count":1,"p_request_id":"00000000-0000-4000-8000-000000000001"}}');
  IF (SELECT current_points FROM public.students WHERE student_id='00000') <> 170 THEN RAISE EXCEPTION 'Duplicate credit'; END IF;
  IF (SELECT count(*) FROM public.recycle_logs WHERE student_id='00000') <> 2 THEN RAISE EXCEPTION 'Duplicate or missing logs'; END IF;

  denied := false;
  BEGIN
    PERFORM public.secure_api('invalid', '{"table":"students","operation":"select"}');
  EXCEPTION WHEN invalid_authorization_specification THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Invalid LINE token accepted'; END IF;
END;
$$;
ROLLBACK;
SELECT 'PASS: ownership, points authorization, atomic deposit, duplicate prevention, invalid LINE token; fixtures rolled back' AS result;
