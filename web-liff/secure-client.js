(function () {
  'use strict';
  function createSecureClient(url, key, options = {}) {
    async function rawCall(payload) {
      try {
        const idToken = window.liff?.getIDToken();
        if (!idToken) throw new Error('กรุณาเข้าสู่ระบบ LINE ก่อน');
        const response = await fetch(`${url}/rest/v1/rpc/secure_api`, {
          method: 'POST',
          headers: { apikey: key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_id_token: idToken, p_request: payload }),
        });
        const result = await response.json();
        if (!response.ok) return {data:null,error:{message:result.message || 'ไม่สามารถยืนยันสิทธิ์ได้',code:result.code,status:response.status},count:null};
        return result;
      } catch (error) {
        return { data: null, error: { message: error.message }, count: null };
      }
    }
    async function call(payload) {
      const mutation=['insert','update','delete'].includes(payload.operation) || (payload.operation==='rpc' && ['approve_account_binding','update_support_report'].includes(payload.name));
      if (!mutation || !options.beforeMutation) return rawCall(payload);
      try {
        const args=await options.beforeMutation(JSON.parse(JSON.stringify(payload)));
        if (!args) return {data:null,error:{message:'ยกเลิกรายการแล้ว',cancelled:true},count:0};
        const result=await rawCall({operation:'rpc',name:'admin_mutate',args});
        options.afterMutation?.(result,args);
        return result;
      } catch(error) { return {data:null,error:{message:error.message},count:0}; }
    }
    function from(table) {
      const request = { table, operation: 'select', filters: [], columns: '*', limit: 1000, offset: 0 };
      const query = {
        select(columns = '*', options = {}) { request.columns = columns; request.count = options.count; return query; },
        eq(column, value) { request.filters.push({ column, value, op: 'eq' }); return query; },
        ilike(column, value) { request.filters.push({ column, value, op: 'ilike' }); return query; },
        order(column, options = {}) { request.order = column; request.ascending = options.ascending !== false; return query; },
        limit(limit) { request.limit = limit; return query; },
        range(from, to) { request.offset = from; request.limit = to - from + 1; return query; },
        update(values) { request.operation = 'update'; request.values = values; return query; },
        insert(values) { request.operation = 'insert'; request.values = values; return query; },
        delete() { request.operation = 'delete'; return query; },
        single() { request.single = true; return query; },
        maybeSingle() { request.single = true; request.optional = true; return query; },
        then(resolve, reject) { return call(request).then(resolve, reject); },
      };
      return query;
    }
    return { from, rpc: (name, args) => call({ operation: 'rpc', name, args }) };
  }
  window.createSecureClient = createSecureClient;
})();
