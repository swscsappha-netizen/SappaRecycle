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
    'ใบเพิ่มคะแนนคุณลักษณะ +5 คะแนน',
    'ใบรับรองแลกคะแนนคุณลักษณะอันพึงประสงค์ สำหรับยื่นให้อาจารย์ประจำชั้น',
    100,
    50,
    'character',
    'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=400&q=80'
),
(
    '00000000-0000-0000-0000-000000000004',
    'รูบิคฝึกสมอง / ของเล่นเสริมทักษะ',
    'รูบิคหมุนลื่น ฝึกทักษะการแก้ปัญหาและความคิดสร้างสรรค์',
    150,
    30,
    'toy',
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80'
),
(
    '00000000-0000-0000-0000-000000000005',
    'โมเดลตัวต่อรักษ์โลก Eco Blocks',
    'ชุดบล็อกตัวต่อสร้างสรรค์ ผลิตจากพลาสติกรีไซเคิลคุณภาพสูง',
    200,
    20,
    'toy',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80'
)
ON CONFLICT (reward_id) DO UPDATE 
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    points_required = EXCLUDED.points_required,
    stock_quantity = EXCLUDED.stock_quantity,
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url;
