-- ============================================================
-- Kids & Baby Store POS — Migration 019: Unpredictable document numbers
-- Run after 018
--
-- WHY:
--   The old generators (013) built numbers as PREFIX-{branch}-{YYYYMMDD}-{seq},
--   where {seq} = max(existing)+1 for the day. Both the date and the running
--   sequence are fully predictable, so anyone who sees one document number can
--   trivially guess valid neighbouring numbers (today's INV-KLA-20260615-0007
--   implies 0001..0006 already exist, and tomorrow's will be 20260616-0001…).
--   That leaks daily sales volume and enables enumeration of records.
--
-- FIX:
--   Replace the date+sequence tail with a cryptographically-random token drawn
--   from pgcrypto's gen_random_bytes() (a CSPRNG — unlike random(), which is a
--   predictable PRNG). The numbers are no longer ordered or guessable.
--
--   • sale     → INV-{branch_code}-{10 random digits}
--   • return   → RET-{branch_code}-{10 random digits}
--   • transfer → TRF-{10 random digits}
--
--   sale_number / return_number / transfer_number all carry a UNIQUE index, so
--   each generator generate-and-checks, retrying on the astronomically rare
--   collision; the UNIQUE constraint on INSERT remains the ultimate guard.
--
--   The true business date still lives in created_at — nothing here depended on
--   the date embedded in the number for reporting (reports use sales_day()).
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 0. CSPRNG numeric-token helper (shared by all three generators)
-- ════════════════════════════════════════════════════════════
-- Returns a zero-padded string of p_len cryptographically-random decimal
-- digits (leading zeros kept — it is an opaque token, not an integer).
create or replace function random_numeric_token(p_len int)
returns text
language plpgsql
volatile
as $$
declare
  v_max  bigint;
  v_rand bigint;
begin
  if p_len < 1 or p_len > 18 then
    raise exception 'random_numeric_token: p_len must be between 1 and 18 (got %)', p_len;
  end if;

  v_max := power(10, p_len)::bigint;                      -- e.g. 10 digits -> 10^10

  -- 8 CSPRNG bytes -> 64-bit value -> non-negative bigint (clear the sign bit).
  v_rand := (('x' || encode(gen_random_bytes(8), 'hex'))::bit(64)::bigint)
            & 9223372036854775807;                        -- 0x7FFF... (2^63 - 1)

  return lpad((v_rand % v_max)::text, p_len, '0');
end; $$;

-- ════════════════════════════════════════════════════════════
-- 1. SALE NUMBER  →  INV-{branch_code}-{10 random digits}
-- ════════════════════════════════════════════════════════════
drop function if exists generate_sale_number(uuid);

create or replace function generate_sale_number(p_branch_id uuid)
returns text language plpgsql as $$
declare
  v_code      text;
  v_candidate text;
  v_attempts  int := 0;
begin
  select code into v_code from branches where id = p_branch_id;
  v_code := coalesce(v_code, 'XXX');

  loop
    v_candidate := 'INV-' || v_code || '-' || random_numeric_token(10);
    exit when not exists (select 1 from sales where sale_number = v_candidate);

    v_attempts := v_attempts + 1;
    if v_attempts >= 10 then
      raise exception 'Could not generate a unique sale number after % attempts', v_attempts;
    end if;
  end loop;

  return v_candidate;
end; $$;

-- ════════════════════════════════════════════════════════════
-- 2. RETURN NUMBER  →  RET-{branch_code}-{10 random digits}
-- ════════════════════════════════════════════════════════════
drop function if exists generate_return_number(uuid);

create or replace function generate_return_number(p_branch_id uuid)
returns text language plpgsql as $$
declare
  v_code      text;
  v_candidate text;
  v_attempts  int := 0;
begin
  select code into v_code from branches where id = p_branch_id;
  v_code := coalesce(v_code, 'XXX');

  loop
    v_candidate := 'RET-' || v_code || '-' || random_numeric_token(10);
    exit when not exists (select 1 from returns where return_number = v_candidate);

    v_attempts := v_attempts + 1;
    if v_attempts >= 10 then
      raise exception 'Could not generate a unique return number after % attempts', v_attempts;
    end if;
  end loop;

  return v_candidate;
end; $$;

-- ════════════════════════════════════════════════════════════
-- 3. TRANSFER NUMBER  →  TRF-{10 random digits}
--    (no branch code — transfers span two branches)
-- ════════════════════════════════════════════════════════════
drop function if exists generate_transfer_number();

create or replace function generate_transfer_number()
returns text language plpgsql as $$
declare
  v_candidate text;
  v_attempts  int := 0;
begin
  loop
    v_candidate := 'TRF-' || random_numeric_token(10);
    exit when not exists (select 1 from stock_transfers where transfer_number = v_candidate);

    v_attempts := v_attempts + 1;
    if v_attempts >= 10 then
      raise exception 'Could not generate a unique transfer number after % attempts', v_attempts;
    end if;
  end loop;

  return v_candidate;
end; $$;
