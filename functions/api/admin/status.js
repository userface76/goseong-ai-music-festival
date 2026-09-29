export async function onRequestPost({request, env}) {
  const {receipt_no, status} = await request.json();

  const allowed = [
    '접수','가사제작','음원제작',
    '에이미온업로드','전달완료','취소'
  ];

  if(!allowed.includes(status)){
    return Response.json({error:'잘못된 상태값입니다.'}, {status:400});
  }

  await env.DB.prepare(`
    UPDATE submissions
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE receipt_no = ?
  `).bind(status, receipt_no).run();

  return Response.json({success:true});
}
