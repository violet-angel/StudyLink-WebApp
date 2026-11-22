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
 
    
app.patch('/api/admin/users/:id/role', requireAuth, safe(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'System administrator access required.'
    });
  }

  const userId = Number(req.params.id);
  const { role } = req.body || {};

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: 'Invalid user ID.'
    });
  }

  if (!['student', 'admin'].includes(role)) {
    return res.status(400).json({
      message: 'Invalid role selected.'
    });
  }

  if (userId === Number(req.user.id)) {
    return res.status(403).json({
      message: 'You cannot change your own administrator role.'
    });
  }

  const result = await query(`
    UPDATE users
    SET role = $1,
        updated_at = NOW()
    WHERE id = $2
      AND is_active = TRUE
    RETURNING
      id,
      full_name AS name,
      email,
      role,
      is_active AS "isActive"
  `, [role, userId]);

  if (!result.rows.length) {
    return res.status(404).json({
      message: 'Active user account not found.'
    });
  }

  return res.json({
    message: 'User role updated successfully.',
    user: result.rows[0]
  });
}));

    app.get('/api/admin/users', requireAuth, safe(async (req, res) => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Administrator access required.'
        });
      }

      const result = await query(`
        SELECT
          id,
          full_name AS name,
          email,
          role,
          university,
          major,
          year_of_study AS "yearOfStudy",
          is_active AS "isActive",
          suspended_at AS "suspendedAt",
          suspension_reason AS "suspensionReason",
          created_at AS "createdAt"
        FROM users
        ORDER BY created_at DESC
      `);

      return res.json({
        users: result.rows
      });
    }));
    app.get('/api/admin/dashboard', requireAuth, safe(async (req, res) => {

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'System administrator access required.'
        });
      }

      const [summary, trends, users, groups] = await Promise.all([

        // Platform-wide statistics
        query(`
          SELECT
            (SELECT COUNT(*) FROM users
            WHERE role = 'student')::int
              AS "totalStudents",

            (SELECT COUNT(*) FROM study_groups)::int
              AS "totalGroups",

            (SELECT COUNT(*) FROM courses)::int
              AS "totalCourses",

            (SELECT COUNT(*) FROM resources)::int
              AS "totalResources",

            (SELECT COUNT(*) FROM sessions)::int
              AS "totalSessions",

            (SELECT COUNT(*) FROM student_messages)::int
              AS "totalMessages"
        `),

        // Six-week platform activity trends
        query(`
          WITH weeks AS (
            SELECT
              idx,
              date_trunc('week', now())
                - idx * interval '1 week' AS week_start
            FROM generate_series(5, 0, -1) AS idx
          ),
          activities AS (
            SELECT user_id, joined_at AS at
            FROM group_enrollments

            UNION ALL
            SELECT user_id, enrolled_at
            FROM course_enrollments

            UNION ALL
            SELECT user_id, enrolled_at
            FROM session_enrollments

            UNION ALL
            SELECT user_id, accessed_at
            FROM resource_enrollments

            UNION ALL
            SELECT sender_user_id, created_at
            FROM student_messages

            UNION ALL
            SELECT user_id, updated_at
            FROM student_session_rsvps
          )
          SELECT
            to_char(w.week_start, 'Mon DD') AS label,

            (SELECT COUNT(*) FROM users u
            WHERE u.role = 'student'
            AND u.created_at < w.week_start + interval '1 week'
            AND u.created_at <= now())::int
              AS students,

            (SELECT COUNT(DISTINCT a.user_id)
            FROM activities a
            JOIN users u ON u.id = a.user_id
            WHERE u.role = 'student'
            AND a.at >= w.week_start
            AND a.at < w.week_start + interval '1 week'
            AND a.at <= now())::int
              AS "activeStudents",

            (SELECT COUNT(*) FROM study_groups g
            WHERE g.created_at >= w.week_start
            AND g.created_at < w.week_start + interval '1 week'
            AND g.created_at <= now())::int
              AS groups,

            (SELECT COUNT(*) FROM resources r
            WHERE r.created_at >= w.week_start
            AND r.created_at < w.week_start + interval '1 week'
            AND r.created_at <= now())::int
              AS resources,

            (SELECT COUNT(*) FROM student_messages m
            WHERE m.created_at >= w.week_start
            AND m.created_at < w.week_start + interval '1 week'
            AND m.created_at <= now())::int
              AS messages

          FROM weeks w
          ORDER BY w.idx DESC
        `),

        // Recently registered users
        query(`
          SELECT
            id,
            full_name AS name,
            email,
            role,
            created_at AS "createdAt"
          FROM users
          ORDER BY created_at DESC
          LIMIT 10
        `),

        // Recently created study groups
        query(`
          SELECT
            g.id,
            g.name,
            g.course_code AS "courseCode",
            u.full_name AS owner,

            (SELECT COUNT(*) FROM group_enrollments ge
            WHERE ge.group_id = g.id)::int AS members,

            (SELECT COUNT(*) FROM resources r
            WHERE r.group_id = g.id)::int AS resources

          FROM study_groups g
          LEFT JOIN users u ON u.id = g.owner_user_id
          ORDER BY g.created_at DESC
          LIMIT 10
        `)

      ]);

      return res.json({
        summary: summary.rows[0],
        trends: trends.rows,
        recentUsers: users.rows,
        recentGroups: groups.rows
      });
    }));

    app.patch('/api/admin/users/:id/status', requireAuth, safe(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Administrator access required.'
    });
  }

  const userId = req.params.id;
  const { isActive, reason } = req.body;

  if (!/^[1-9]\d*$/.test(userId)) {
    return res.status(400).json({
      message: 'Invalid user ID.'
    });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      message: 'Invalid account status.'
    });
  }

  if (String(userId) === String(req.user.id)) {
    return res.status(400).json({
      message: 'You cannot suspend your own account.'
    });
  }

  if (!isActive && (
    typeof reason !== 'string' ||
    !reason.trim() ||
    reason.trim().length > 500
  )) {
    return res.status(400).json({
      message: 'Provide a suspension reason of 1–500 characters.'
    });
  }

  const result = await query(`
    UPDATE users
    SET
      is_active = $1,
      suspended_at = CASE
        WHEN $1 THEN NULL
        ELSE now()
      END,
      suspension_reason = CASE
        WHEN $1 THEN NULL
        ELSE $2
      END,
      updated_at = now()
    WHERE id = $3
      AND role = 'student'
    RETURNING
      id,
      full_name AS name,
      email,
      role,
      is_active AS "isActive",
      suspended_at AS "suspendedAt",
      suspension_reason AS "suspensionReason"
  `, [
    isActive,
    isActive ? null : reason.trim(),
    userId
  ]);

  if (!result.rows.length) {
    return res.status(404).json({
      message: 'Student account not found or protected.'
    });
  }

  return res.json({
    message: isActive
      ? 'Account reactivated successfully.'
      : 'Account suspended successfully.',
    user: result.rows[0]
  });
}));

    app.get('/api/group-admin/dashboard', requireAuth, safe(async (req, res) => {

     

      const userId = req.user.id;

      const groups = await query(`
        SELECT id, name, course_code AS "courseCode"
        FROM study_groups
        WHERE owner_user_id = $1
        ORDER BY name
      `, [userId]);

      if (groups.rows.length === 0) {
        return res.status(403).json({
          message: 'You do not administer any study groups.'
        });
      }

      const selectedGroupId = req.query.groupId || null;

      if (
        selectedGroupId &&
        !groups.rows.some(
          group => String(group.id) === String(selectedGroupId)
        )
      ) {
        return res.status(403).json({
          message: 'You are not authorised to manage this group.'
        });
      }

      const [summary, trends, managedGroups, upcoming] =
        await Promise.all([

          // Dashboard summary cards
          query(`
            WITH owned AS (
              SELECT id FROM study_groups
              WHERE owner_user_id = $1
              AND ($2::bigint IS NULL OR id = $2)
            )
            SELECT
              (SELECT COUNT(*) FROM owned)::int
                AS "totalGroups",

              (SELECT COUNT(DISTINCT user_id)
              FROM group_enrollments
              WHERE group_id IN (SELECT id FROM owned))::int
                AS "totalMembers",

              (SELECT COUNT(DISTINCT sender_user_id)
              FROM student_messages
              WHERE group_id IN (SELECT id FROM owned)
              AND created_at >= now() - interval '7 days')::int
                AS "activeMembers",

              (SELECT COUNT(*) FROM sessions
              WHERE group_id IN (SELECT id FROM owned)
              AND starts_at >= now())::int
                AS "upcomingSessions",

              (SELECT COUNT(*) FROM resources
              WHERE group_id IN (SELECT id FROM owned))::int
                AS "totalResources",

              (SELECT COUNT(*) FROM student_messages
              WHERE group_id IN (SELECT id FROM owned))::int
                AS "totalMessages"
          `, [userId, selectedGroupId]),

          // Six-week line graph statistics
          query(`
            WITH owned AS (
              SELECT id FROM study_groups
              WHERE owner_user_id = $1
              AND ($2::bigint IS NULL OR id = $2)
            ),
            weeks AS (
              SELECT
                idx,
                date_trunc('week', now())
                  - idx * interval '1 week' AS week_start
              FROM generate_series(5, 0, -1) AS idx
            )
            SELECT
              to_char(w.week_start, 'Mon DD') AS label,

              (SELECT COUNT(DISTINCT ge.user_id)
              FROM group_enrollments ge
              WHERE ge.group_id IN (SELECT id FROM owned)
              AND ge.joined_at < w.week_start + interval '1 week'
              AND ge.joined_at <= now())::int
                AS members,

              (SELECT COUNT(DISTINCT sm.sender_user_id)
              FROM student_messages sm
              WHERE sm.group_id IN (SELECT id FROM owned)
              AND sm.created_at >= w.week_start
              AND sm.created_at < w.week_start + interval '1 week'
              AND sm.created_at <= now())::int
                AS "activeMembers",

              (SELECT COUNT(*) FROM student_messages sm
              WHERE sm.group_id IN (SELECT id FROM owned)
              AND sm.created_at >= w.week_start
              AND sm.created_at < w.week_start + interval '1 week'
              AND sm.created_at <= now())::int
                AS messages,

              (SELECT COUNT(*) FROM resources r
              WHERE r.group_id IN (SELECT id FROM owned)
              AND r.created_at >= w.week_start
              AND r.created_at < w.week_start + interval '1 week'
              AND r.created_at <= now())::int
                AS resources,

              (SELECT COUNT(*) FROM sessions s
              WHERE s.group_id IN (SELECT id FROM owned)
              AND s.starts_at >= w.week_start
              AND s.starts_at < w.week_start + interval '1 week'
              AND s.starts_at <= now())::int
                AS sessions

            FROM weeks w
            ORDER BY w.idx DESC
          `, [userId, selectedGroupId]),

          // Groups managed by this administrator
          query(`
            SELECT
              g.id,
              g.name,
              g.course_code AS "courseCode",

              (SELECT COUNT(*) FROM group_enrollments ge
              WHERE ge.group_id = g.id)::int AS members,

              (SELECT COUNT(*) FROM resources r
              WHERE r.group_id = g.id)::int AS resources,

              (SELECT COUNT(*) FROM sessions s
              WHERE s.group_id = g.id
              AND s.starts_at >= now())::int
                AS "upcomingSessions"

            FROM study_groups g
            WHERE g.owner_user_id = $1
            AND ($2::bigint IS NULL OR g.id = $2)
            ORDER BY g.name
          `, [userId, selectedGroupId]),

          // Upcoming group sessions
          query(`
            SELECT
              s.id,
              s.title,
              s.starts_at AS "startsAt",
              g.id AS "groupId",
              g.name AS "groupName"
            FROM sessions s
            JOIN study_groups g ON g.id = s.group_id
            WHERE g.owner_user_id = $1
            AND ($2::bigint IS NULL OR g.id = $2)
            AND s.starts_at >= now()
            ORDER BY s.starts_at
            LIMIT 5
          `, [userId, selectedGroupId])

        ]);

      return res.json({
        groups: groups.rows,
        summary: summary.rows[0],
        trends: trends.rows,
        managedGroups: managedGroups.rows,
        upcomingSessions: upcoming.rows
      });
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
      (SELECT round(avg(points)::numeric,1) FROM totals WHERE user_id<>$1) AS "peerAverage",
      (SELECT count(*)::int FROM activities WHERE user_id=$1 AND occurred_at>=now()-interval '7 days') AS "yourActions",
      (SELECT count(*)::int FROM group_enrollments WHERE user_id=$1) AS "myGroups",
      (SELECT count(*)::int FROM session_enrollments WHERE user_id=$1) AS "mySessionRegistrations",
      (SELECT count(*)::int FROM resource_enrollments WHERE user_id=$1) AS "mySavedResources",
      (SELECT count(*)::int FROM student_messages WHERE sender_user_id=$1) AS "myMessages"`;
    const [summary,weeks,upcoming] = await Promise.all([
      query(sql,[userId]),
      
      query(`
        WITH weeks AS (
          SELECT generate_series(5,0,-1) AS idx
        ),
        activities AS (
          SELECT user_id, joined_at AS at, 1 AS points
          FROM group_enrollments

          UNION ALL
          SELECT user_id, enrolled_at, 2
          FROM session_enrollments

          UNION ALL
          SELECT user_id, accessed_at, 1
          FROM resource_enrollments

          UNION ALL
          SELECT sender_user_id, created_at, 3
          FROM student_messages

          UNION ALL
          SELECT user_id, updated_at, 2
          FROM student_session_rsvps
        ),
        peers AS (
          SELECT DISTINCT ge2.user_id
          FROM group_enrollments ge1
          JOIN group_enrollments ge2
            ON ge2.group_id = ge1.group_id
          WHERE ge1.user_id = $1
            AND ge2.user_id <> $1
        ),
        weekly_totals AS (
          SELECT
            w.idx,
            a.user_id,
            SUM(a.points) AS points
          FROM weeks w
          JOIN activities a
            ON a.at >= date_trunc('week', now())
              - (w.idx * interval '1 week')
            AND a.at < date_trunc('week', now())
              - ((w.idx - 1) * interval '1 week')
            AND a.at <= now()
          WHERE a.user_id = $1
            OR a.user_id IN (SELECT user_id FROM peers)
          GROUP BY w.idx, a.user_id
        )
        SELECT
          to_char(
            date_trunc('week', now())
            - (w.idx * interval '1 week'),
            'Mon DD'
          ) AS label,

          COALESCE((
            SELECT wt.points
            FROM weekly_totals wt
            WHERE wt.idx = w.idx
              AND wt.user_id = $1
          ), 0)::int AS points,

          CASE
            WHEN (SELECT COUNT(*) FROM peers) >= 4
            THEN (
              SELECT ROUND(
                AVG(COALESCE(wt.points, 0))::numeric, 1
              )
              FROM peers p
              LEFT JOIN weekly_totals wt
                ON wt.user_id = p.user_id
                AND wt.idx = w.idx
            )
            ELSE NULL
          END AS "peerAverage"

        FROM weeks w
        ORDER BY w.idx DESC
      `, [userId]),

      query(`SELECT s.id,s.title,s.starts_at AS "startsAt",g.name AS "groupName",g.id AS "groupId",
           r.status AS "myRsvp" FROM sessions s JOIN study_groups g ON g.id=s.group_id
           JOIN group_enrollments ge ON ge.group_id=g.id AND ge.user_id=$1
           LEFT JOIN student_session_rsvps r ON r.session_id=s.id AND r.user_id=$1
           WHERE s.starts_at>=now() ORDER BY s.starts_at LIMIT 5`,[userId])
    ]);
    
    const data = summary.rows?.[0] ?? {};

    // Ensure the dashboard has valid values for new students.
    data.peerCount = Number(data.peerCount ?? 0);

    // Avoid displaying aggregate comparisons of tiny cohorts.
    if (data.peerCount < 5) {
      data.peerAverage = null;
    }

    return res.json({
      summary: data,
      weeks: weeks.rows ?? [],
      upcomingSessions: upcoming.rows ?? [],
      methodology: {
        windowDays: 7,
        weights: {
          group: 1,
          session: 2,
          resource: 1,
          message: 3,
          rsvp: 2
        },
        comparison:
          'Average of students sharing at least one group with you, shown only for cohorts of at least five.'
      }
    });
  }));

}
