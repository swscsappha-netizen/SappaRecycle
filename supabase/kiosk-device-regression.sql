BEGIN;
DO $$
DECLARE denied boolean:=false; result jsonb;
BEGIN
  BEGIN PERFORM public.kiosk_device_api(repeat('0',64),'{}');
  EXCEPTION WHEN invalid_authorization_specification THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Unregistered device accepted'; END IF;
  INSERT INTO recycle_private.kiosk_devices VALUES(encode(sha256(convert_to(repeat('a',64),'UTF8')),'hex'),'32650',true);
  result:=public.kiosk_device_api(repeat('a',64),'{"operation":"select","table":"students","single":true,"optional":true,"filters":[{"column":"student_id","op":"eq","value":"32650"}]}');
  IF result->'data'->>'student_id' IS DISTINCT FROM '32650' THEN RAISE EXCEPTION 'Registered device lookup failed'; END IF;
  denied:=false;
  BEGIN PERFORM public.kiosk_device_api(repeat('a',64),'{}');
  EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Empty operation accepted'; END IF;
  denied:=false;
  BEGIN PERFORM public.kiosk_device_api(repeat('a',64),'{"operation":"update","table":"students","values":{"current_points":999999}}');
  EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Arbitrary points update accepted'; END IF;
  IF has_table_privilege('anon','recycle_private.kiosk_devices','SELECT') THEN RAISE EXCEPTION 'Device credentials exposed'; END IF;
END;
$$;
SELECT 'PASS: registered device lookup; unregistered device denied; empty request and arbitrary writes denied; credentials private' AS result;
ROLLBACK;
