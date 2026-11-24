-- 업데이트 v4: 쿠폰 사용 요청 취소(운동러) · 쿠폰 삭제(관리자)
-- SQL Editor 에 붙여 넣고 Run. 여러 번 실행해도 괜찮아요.

-- 운동러: 보낸 사용 요청을 취소 → 다시 보유 상태로
create or replace function cancel_coupon_request(coupon_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if my_role() is distinct from 'user' then raise exception '운동러만 할 수 있어요'; end if;
  update coupons set status = 'owned', want_date = null where id = coupon_id and status = 'requested';
  if not found then raise exception '취소할 수 있는 요청이 없어요'; end if;
end $$;

-- 관리자: 쿠폰 자체를 지우기 (잘못 나온 쿠폰, 테스트 쿠폰 등)
create or replace function delete_coupon(coupon_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if my_role() is distinct from 'admin' then raise exception '관리자만 할 수 있어요'; end if;
  delete from coupons where id = coupon_id;
  if not found then raise exception '이미 지워진 쿠폰이에요'; end if;
end $$;

revoke execute on function cancel_coupon_request, delete_coupon from anon, public;
grant execute on function cancel_coupon_request, delete_coupon to authenticated;
