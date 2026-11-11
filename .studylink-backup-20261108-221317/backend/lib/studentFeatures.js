/** Additive student APIs. Mount after requireAuth is declared, before the 404 handler.
 * Requires PostgreSQL and scripts/student_features.sql to have been applied.
 */
export function registerStudentFeatures({ app, requireAuth, query }) {
  const safe = (handler) => async (req, res, next) => {
    try { await handler(req, res); } catch (error) { next(error); }
  };
  const id = (x) => Number.isSafeInteger(Number(x)) && Number(x) > 0 ? Number(x) : null;
  const allowedGroup = async (userId, groupId) => {
    const r = await query(`SELECT 1 FROM group_enrollments
      WHERE group_id = $1 AND user_id = $2 LIMIT 1`, [groupId, userId]);
    return r.rows.length > 0;
  };
  const allowedSession = async (userId, sessionId) => {
    const r = await query(`SELECT s.id, s.group_id, s.title
       FROM sessions s JOIN group_enrollments ge ON ge.group_id=s.group_id
       WHERE s.id=$1 AND ge.user_id=$2 LIMIT 1`, [sessionId, userId]);
    return r.rows[0] || null;
  };

  app.get('/api/student/messages/:groupId', requireAuth, safe(async (req, res) => {
    const groupId = id(req.params.groupId);
    if (!groupId) return res.status(400).json({message:'Invalid group ID.'});
    if (!(await allowedGroup(req.user.id,groupId))) return res.status(403).json({message:'Join the group to read its messages.'});
    const r = await query(`SELECT m.id,m.group_id AS "groupId",m.sender_user_id AS "senderId",
       u.full_name AS "senderName",m.body,m.created_at AS "createdAt"
       FROM student_messages m JOIN users u ON u.id=m.sender_user_id
       WHERE m.group_id=$1 ORDER BY m.created_at DESC,m.id DESC LIMIT 100`, [groupId]);
    return res.json({messages:r.rows.reverse()});
  }));

  app.post('/api/student/messages/:groupId', requireAuth, safe(async (req,res) => {
    const groupId = id(req.params.groupId);
    const body = String(req.body?.body || '').trim();
    if (!groupId || !body || body.length > 2000) return res.status(400).json({message:'Message must be 1–2000 characters.'});
    if (!(await allowedGroup(req.user.id,groupId))) return res.status(403).json({message:'Join the group before messaging.'});
    const r = await query(`INSERT INTO student_messages(group_id,sender_user_id,body)
      VALUES($1,$2,$3) RETURNING id,group_id AS "groupId",sender_user_id AS "senderId",body,created_at AS "createdAt"`,
      [groupId,req.user.id,body]);
    await query(`INSERT INTO student_notifications(user_id,kind,title,body,href)
      SELECT ge.user_id,'group_message','New message in your study group',left($3,140),$4
      FROM group_enrollments ge WHERE ge.group_id=$1 AND ge.user_id<>$2`,
      [groupId,req.user.id,body,`/groups/${groupId}`]);
    return res.status(201).json({message:r.rows[0]});
  }));

  app.put('/api/student/sessions/:sessionId/rsvp', requireAuth, safe(async (req,res) => {
    const sessionId=id(req.params.sessionId);
    const status=String(req.body?.status || '');
    if (!sessionId || !['attending','maybe','not_attending'].includes(status))
      return res.status(400).json({message:'Choose attending, maybe, or not_attending.'});
    const session=await allowedSession(req.user.id,sessionId);
    if (!session) return res.status(403).json({message:'Join the session group to RSVP.'});
    const r=await query(`INSERT INTO student_session_rsvps(session_id,user_id,status)
      VALUES($1,$2,$3) ON CONFLICT(session_id,user_id) DO UPDATE
      SET status=EXCLUDED.status,updated_at=now() RETURNING status,updated_at AS "updatedAt"`,
      [sessionId,req.user.id,status]);
    return res.json({rsvp:r.rows[0]});
  }));

  app.get('/api/student/notifications', requireAuth, safe(async (req,res) => {
    const r=await query(`SELECT id,kind,title,body,href,created_at AS "createdAt",read_at AS "readAt"
      FROM student_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 40`, [req.user.id]);
    return res.json({notifications:r.rows,unread:r.rows.filter(n=>!n.readAt).length});
  }));

  app.patch('/api/student/notifications/:notificationId/read', requireAuth, safe(async (req,res) => {
    const notificationId=id(req.params.notificationId);
    if(!notificationId)return res.status(400).json({message:'Invalid notification ID.'});
    const r=await query(`UPDATE student_notifications SET read_at=coalesce(read_at,now())
      WHERE id=$1 AND user_id=$2 RETURNING id`,[notificationId,req.user.id]);
    return r.rows.length?res.json({ok:true}):res.status(404).json({message:'Notification not found.'});
  }));

  app.get('/api/student/dashboard', requireAuth, safe(async (req,res) => {
    const userId=req.user.id;
    // Uses actual event timestamps: joining a group, registering for a session,
    // saving a resource, posting a message, and responding to a session.
    // These are PARTICIPATION indicators, not academic grades or physical attendance.
    const sql=`WITH activities AS (
      SELECT user_id,joined_at AS occurred_at,1::int AS points,'group' AS kind FROM group_enrollments
      UNION ALL SELECT user_id,enrolled_at,2,'session' FROM session_enrollments
      UNION ALL SELECT user_id,accessed_at,1,'resource' FROM resource_enrollments
      UNION ALL SELECT sender_user_id,created_at,3,'message' FROM student_messages
      UNION ALL SELECT user_id,updated_at,2,'rsvp' FROM student_session_rsvps
    ), peers AS (
      SELECT DISTINCT ge2.user_id FROM group_enrollments ge1
      JOIN group_enrollments ge2 ON ge2.group_id=ge1.group_id
      WHERE ge1.user_id=$1
      UNION SELECT $1::bigint
    ), totals AS (
      SELECT p.user_id,coalesce(sum(a.points) FILTER(WHERE a.occurred_at>=now()-interval '7 days'),0)::int AS points
      FROM peers p LEFT JOIN activities a ON a.user_id=p.user_id GROUP BY p.user_id
    )
    SELECT (SELECT points FROM totals WHERE user_id=$1) AS "yourPoints",
      (SELECT count(*)::int FROM totals) AS "peerCount",
      (SELECT round(avg(points)::numeric,1) FROM totals) AS "peerAverage",
      (SELECT count(*)::int FROM activities WHERE user_id=$1 AND occurred_at>=now()-interval '7 days') AS "yourActions",
      (SELECT count(*)::int FROM group_enrollments WHERE user_id=$1) AS "myGroups",
      (SELECT count(*)::int FROM session_enrollments WHERE user_id=$1) AS "mySessionRegistrations",
      (SELECT count(*)::int FROM resource_enrollments WHERE user_id=$1) AS "mySavedResources",
      (SELECT count(*)::int FROM student_messages WHERE sender_user_id=$1) AS "myMessages"`;
    const [summary,weeks,upcoming] = await Promise.all([
      query(sql,[userId]),
      query(`WITH weeks AS (SELECT generate_series(3,0,-1) AS idx), activities AS (
        SELECT user_id,joined_at AS at,1 AS points FROM group_enrollments
        UNION ALL SELECT user_id,enrolled_at,2 FROM session_enrollments
        UNION ALL SELECT user_id,accessed_at,1 FROM resource_enrollments
        UNION ALL SELECT sender_user_id,created_at,3 FROM student_messages
        UNION ALL SELECT user_id,updated_at,2 FROM student_session_rsvps
      ) SELECT to_char(date_trunc('week',now())-(idx*interval '1 week'),'Mon DD') AS label,
        coalesce(sum(points),0)::int AS points FROM weeks LEFT JOIN activities a
        ON a.user_id=$1 AND a.at>=date_trunc('week',now())-(idx*interval '1 week')
        AND a.at<date_trunc('week',now())-((idx-1)*interval '1 week')
        GROUP BY idx ORDER BY idx DESC`,[userId]),
      query(`SELECT s.id,s.title,s.starts_at AS "startsAt",g.name AS "groupName",g.id AS "groupId",
           r.status AS "myRsvp" FROM sessions s JOIN study_groups g ON g.id=s.group_id
           JOIN group_enrollments ge ON ge.group_id=g.id AND ge.user_id=$1
           LEFT JOIN student_session_rsvps r ON r.session_id=s.id AND r.user_id=$1
           WHERE s.starts_at>=now() ORDER BY s.starts_at LIMIT 5`,[userId])
    ]);
    const data=summary.rows[0];
    // Avoid displaying aggregate comparison of tiny cohorts.
    if(data.peerCount<5) data.peerAverage=null;
    return res.json({summary:data,weeks:weeks.rows,upcomingSessions:upcoming.rows,
      methodology:{windowDays:7,weights:{group:1,session:2,resource:1,message:3,rsvp:2},
      comparison:'Average of students sharing at least one group with you, shown only for cohorts of at least five.'}});
  }));
}
