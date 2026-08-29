-- ============================================================================
-- SMART BOTTLE RECYCLING KIOSK & REWARD SYSTEM SCHEMA
-- Sapphawitthayakhom School, Mae Sot, Tak
-- Platform: Supabase PostgreSQL
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Table: students
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    student_id VARCHAR(5) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    room VARCHAR(20) NOT NULL,
    no INT,
    phone_number VARCHAR(15),
    line_user_id VARCHAR(100) UNIQUE,
    current_points INT NOT NULL DEFAULT 0 CHECK (current_points >= 0),
    total_bottles_recycled INT NOT NULL DEFAULT 0 CHECK (total_bottles_recycled >= 0),
    is_council_member BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_room ON public.students(room);
CREATE INDEX IF NOT EXISTS idx_students_line_user_id ON public.students(line_user_id);
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students(phone_number);

-- ----------------------------------------------------------------------------
-- 2. Table: rewards
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rewards (
    reward_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INT NOT NULL CHECK (points_required > 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON public.rewards(is_active);

-- ----------------------------------------------------------------------------
-- 3. Table: coupons
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    coupon_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(5) NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.rewards(reward_id) ON DELETE RESTRICT,
    coupon_code VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REDEEMED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    redeemed_at TIMESTAMP WITH TIME ZONE,
    redeemed_by_line_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_student ON public.coupons(student_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);

-- ----------------------------------------------------------------------------
-- 4. Table: recycle_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recycle_logs (
    log_id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(5) NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('PET', 'CAN', 'REJECT')),
    points_earned INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recycle_logs_student ON public.recycle_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_recycle_logs_created_at ON public.recycle_logs(created_at);

-- ----------------------------------------------------------------------------
-- 5. Stored Procedures & Atomic Functions
-- ----------------------------------------------------------------------------

-- Function to record recycling session and credit points
CREATE OR REPLACE FUNCTION public.credit_recycle_batch(
    p_student_id VARCHAR(5),
    p_pet_count INT,
    p_can_count INT
)
RETURNS JSON AS $$
DECLARE
    v_points_earned INT;
    v_total_items INT;
    v_new_points INT;
    v_new_total_bottles INT;
    i INT;
BEGIN
    v_points_earned := (p_pet_count * 10) + (p_can_count * 20);
    v_total_items := p_pet_count + p_can_count;

    -- Update student balance
    UPDATE public.students
    SET current_points = current_points + v_points_earned,
        total_bottles_recycled = total_bottles_recycled + v_total_items,
        updated_at = NOW()
    WHERE student_id = p_student_id
    RETURNING current_points, total_bottles_recycled INTO v_new_points, v_new_total_bottles;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student ID % not found', p_student_id;
    END IF;

    -- Insert individual recycle logs for PET
    IF p_pet_count > 0 THEN
        FOR i IN 1..p_pet_count LOOP
            INSERT INTO public.recycle_logs(student_id, item_type, points_earned)
            VALUES (p_student_id, 'PET', 10);
        END LOOP;
    END IF;

    -- Insert individual recycle logs for CAN
    IF p_can_count > 0 THEN
        FOR i IN 1..p_can_count LOOP
            INSERT INTO public.recycle_logs(student_id, item_type, points_earned)
            VALUES (p_student_id, 'CAN', 20);
        END LOOP;
    END IF;

    RETURN json_build_object(
        'success', TRUE,
        'student_id', p_student_id,
        'points_earned', v_points_earned,
        'current_points', v_new_points,
        'total_bottles_recycled', v_new_total_bottles
    );
END;
$$ LANGUAGE plpgsql;

-- Function to redeem reward and create QR coupon (Atomic transaction)
CREATE OR REPLACE FUNCTION public.redeem_reward_coupon(
    p_student_id VARCHAR(5),
    p_reward_id UUID,
    p_coupon_code VARCHAR(64)
)
RETURNS JSON AS $$
DECLARE
    v_points_required INT;
    v_stock INT;
    v_student_points INT;
    v_student_phone VARCHAR(15);
    v_coupon_id UUID;
BEGIN
    -- Check student and phone requirement (ADR-0001)
    SELECT current_points, phone_number INTO v_student_points, v_student_phone
    FROM public.students
    WHERE student_id = p_student_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student ID % not found', p_student_id;
    END IF;

    IF v_student_phone IS NULL OR trim(v_student_phone) = '' THEN
        RAISE EXCEPTION 'Phone number required before redeeming reward (ADR-0001)';
    END IF;

    -- Check reward points and stock
    SELECT points_required, stock_quantity INTO v_points_required, v_stock
    FROM public.rewards
    WHERE reward_id = p_reward_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reward not found or inactive';
    END IF;

    IF v_stock <= 0 THEN
        RAISE EXCEPTION 'Reward out of stock';
    END IF;

    IF v_student_points < v_points_required THEN
        RAISE EXCEPTION 'Insufficient points: required %, available %', v_points_required, v_student_points;
    END IF;

    -- Deduct student points
    UPDATE public.students
    SET current_points = current_points - v_points_required,
        updated_at = NOW()
    WHERE student_id = p_student_id;

    -- Decrement reward stock
    UPDATE public.rewards
    SET stock_quantity = stock_quantity - 1,
        updated_at = NOW()
    WHERE reward_id = p_reward_id;

    -- Create active coupon
    INSERT INTO public.coupons(student_id, reward_id, coupon_code, status)
    VALUES (p_student_id, p_reward_id, p_coupon_code, 'ACTIVE')
    RETURNING coupon_id INTO v_coupon_id;

    RETURN json_build_object(
        'success', TRUE,
        'coupon_id', v_coupon_id,
        'coupon_code', p_coupon_code,
        'points_deducted', v_points_required,
        'remaining_points', v_student_points - v_points_required
    );
END;
$$ LANGUAGE plpgsql;

-- Function for council admin to verify & mark coupon as redeemed
CREATE OR REPLACE FUNCTION public.confirm_coupon_handover(
    p_coupon_code VARCHAR(64),
    p_council_line_id VARCHAR(100)
)
RETURNS JSON AS $$
DECLARE
    v_coupon_id UUID;
    v_current_status VARCHAR(20);
    v_student_id VARCHAR(5);
    v_student_name VARCHAR(255);
    v_student_room VARCHAR(20);
    v_reward_title VARCHAR(255);
    v_is_council BOOLEAN;
BEGIN
    -- Check council permission
    SELECT is_council_member INTO v_is_council
    FROM public.students
    WHERE line_user_id = p_council_line_id;

    IF v_is_council IS NOT TRUE THEN
        RAISE EXCEPTION 'Unauthorized: User is not a verified council member';
    END IF;

    -- Find coupon
    SELECT c.coupon_id, c.status, s.student_id, s.full_name, s.room, r.title
    INTO v_coupon_id, v_current_status, v_student_id, v_student_name, v_student_room, v_reward_title
    FROM public.coupons c
    JOIN public.students s ON c.student_id = s.student_id
    JOIN public.rewards r ON c.reward_id = r.reward_id
    WHERE c.coupon_code = p_coupon_code;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Coupon not found';
    END IF;

    IF v_current_status = 'REDEEMED' THEN
        RAISE EXCEPTION 'Coupon already redeemed';
    END IF;

    IF v_current_status != 'ACTIVE' THEN
        RAISE EXCEPTION 'Coupon is not in active state (status: %)', v_current_status;
    END IF;

    -- Mark as REDEEMED
    UPDATE public.coupons
    SET status = 'REDEEMED',
        redeemed_at = NOW(),
        redeemed_by_line_id = p_council_line_id
    WHERE coupon_id = v_coupon_id;

    RETURN json_build_object(
        'success', TRUE,
        'coupon_id', v_coupon_id,
        'coupon_code', p_coupon_code,
        'student_id', v_student_id,
        'student_name', v_student_name,
        'student_room', v_student_room,
        'reward_title', v_reward_title,
        'redeemed_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;
