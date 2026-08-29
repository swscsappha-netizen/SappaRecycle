-- ============================================================================
-- SAMPLE REWARDS SEED DATA
-- Sapphawitthayakhom School Student Council Rewards
-- ============================================================================

INSERT INTO public.rewards (reward_id, title, description, points_required, stock_quantity, category, image_url) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'ปากกาเจลรักษ์โลก (Eco Gel Pen)',
    'ปากกาหมึกเจลสีน้ำเงิน ด้ามจับทำจากกระดาษรีไซเคิล เขียนลื่น ไม่สะดุด',
    30,
    150,
    'stationery',
    'https://images.unsplash.com/photo-1585336261026-7756f7ef0cf4?w=400&q=80'
),
(
    '00000000-0000-0000-0000-000000000002',
    'สมุดจดบันทึก Green Earth A5',
    'สมุดโน้ตปกคราฟท์ 80 แผ่น ถนอมสายตา พิมพ์ตราโรงเรียนสรรพวิทยาคม',
    50,
    80,
    'stationery',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80'
),
(
    '00000000-0000-0000-0000-000000000003',
    'คูปองอาหารสหกรณ์โรงเรียน 20 บาท',
    'ใช้แลกซื้ออาหารและเครื่องดื่มที่สหกรณ์โรงเรียนสรรพวิทยาคมได้ทันที',
    100,
    50,
    'voucher',
    'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=400&q=80'
),
(
    '00000000-0000-0000-0000-000000000004',
    'กระบอกน้ำสแตนเลสเก็บอุณหภูมิ 500ml',
    'กระบอกน้ำสุญญากาศ เก็บความเย็นได้ 12 ชม. สกรีนโลโก้สภานักเรียนสรรพวิทยาคม',
    250,
    25,
    'merchandise',
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80'
),
(
    '00000000-0000-0000-0000-000000000005',
    'ถุงผ้าแคนวาส พับเก็บได้',
    'ถุงผ้าลดโลกร้อน ลายการ์ตูนตู้หยอดขวดสรรพวิทยาคม พกพาสะดวก',
    120,
    40,
    'merchandise',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80'
)
ON CONFLICT (reward_id) DO UPDATE 
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    points_required = EXCLUDED.points_required,
    stock_quantity = EXCLUDED.stock_quantity,
    image_url = EXCLUDED.image_url;
