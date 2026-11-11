import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { getStoredUser } from '../lib/session';
import '../styles/student-dashboard.css';

type Summary = {
  yourPoints: number; peerCount: number; peerAverage: number | null;
  yourActions: number; myGroups: number; mySessionRegistrations: number;
  mySavedResources: number; myMessages: number;
};
type Week = { label: string; points: number };
type Session = {id:number;title:string;startsAt:string;groupName:string;groupId:number;myRsvp:string|null};
type DashboardData = {
  summary: Summary; weeks: Week[]; upcomingSessions: Session[];
  methodology: {windowDays:number;comparison:string;weights:Record<string,number>};
};
type Notice={id:number;title:string;body:string;href:string;createdAt:string;readAt:string|null};

async function request<T>(url:string, init?:RequestInit):Promise<T> {
  const response=await apiFetch(url,init);
  if(!response.ok){
    const data=await response.json().catch(()=>({message:''}));
    throw new Error(data.message||`Request failed (${response.status}).`);
  }
  return response.json();
}
function displayNumber(value:number|undefined){return Number(value||0).toLocaleString();}
export default function Dashboard(){
  const [data,setData]=useState<DashboardData|null>(null);
  const [notices,setNotices]=useState<Notice[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [saving,setSaving]=useState<number|null>(null);
  const user=getStoredUser();
  const refresh=useCallback(async()=>{
    setError('');
    try{
      const [dashboard,notifications]=await Promise.all([
        request<DashboardData>('/api/student/dashboard'),
        request<{notifications:Notice[]}>('/api/student/notifications'),
      ]);
      setData(dashboard);setNotices(notifications.notifications);
    }catch(e){setError(e instanceof Error?e.message:'Dashboard unavailable.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);

  const rsvp=async(sessionId:number,status:string)=>{
    setSaving(sessionId);setError('');
    try{
      await request(`/api/student/sessions/${sessionId}/rsvp`,{
        method:'PUT',body:JSON.stringify({status})
      });
      await refresh();
    }catch(e){setError(e instanceof Error?e.message:'Could not save response.');}
    finally{setSaving(null);}
  };
  const markRead=async(notice:Notice)=>{
    if(notice.readAt)return;
    try{
      await request(`/api/student/notifications/${notice.id}/read`,{method:'PATCH'});
      setNotices(previous=>previous.map(item=>item.id===notice.id?{...item,readAt:new Date().toISOString()}:item));
    }catch{setError('Could not mark notification as read.');}
  };
  const sum=data?.summary;
  const weeks=data?.weeks||[];
  const maxPoints=Math.max(1,...weeks.map(w=>Number(w.points)));
  const average=sum?.peerAverage==null?null:Number(sum.peerAverage);
  const score=Number(sum?.yourPoints||0);
  const relative=average===null?null:(average===0?(score>0?100:0):Math.round(((score-average)/average)*100));

  return <section className="student-dashboard workspace-page">
    <div className="container student-dashboard-stack">
      <header className="sd-hero">
        <div><p className="sd-eyebrow">Your StudyLink workspace</p>
          <h1>Welcome back{user?.name?`, ${user.name.split(' ')[0]}`:''}</h1>
          <p>See your real study-group activity, plan upcoming sessions, and compare your participation with your peers.</p>
        </div>
        
        <div className="sd-hero-actions"><Link to="/groups" className="button button-primary"> Find study groups</Link>

          <Link to="/courses" className="button button-secondary">My courses </Link>

          <Link to="/discover-classmates" className="button button-secondary"> Discover Classmates</Link>
        </div>

      </header>
      {loading?<p role="status" className="sd-banner">Loading your progress…</p>:null}
      {error?<div role="alert" className="sd-error">{error} <button type="button" onClick={()=>void refresh()}>Retry</button></div>:null}
      {!loading&&!data?<p className="sd-banner">Progress data is unavailable. No sample statistics are displayed.</p>:null}
      {sum?<>
        <div className="sd-stats">
          {[
            ['Activity points · 7 days',score,'/dashboard'],
            ['Actions · 7 days',sum.yourActions,'/dashboard'],
            ['My study groups',sum.myGroups,'/groups'],
            ['Session registrations',sum.mySessionRegistrations,'/sessions'],
            ['Saved resources',sum.mySavedResources,'/learning?view=library'],
            ['Messages sent',sum.myMessages,'/groups'],
          ].map(([label,value,href])=><Link key={String(label)} className="sd-stat" to={String(href)}>
            <span>{label}</span><strong>{displayNumber(Number(value))}</strong></Link>)}
        </div>
        <div className="sd-panels">
          <section className="sd-panel"><h2>My participation trend</h2><p>Earn points by collaborating; shown by week.</p>
            <div className="sd-chart" role="img" aria-label={`Weekly participation: ${weeks.map(w=>`${w.label}: ${w.points} points`).join(', ')}`}>
              {weeks.map(w=><div className="sd-chart-col" key={w.label}>
                <b>{w.points}</b><div className="sd-chart-track"><div className="sd-chart-bar" style={{height:`${Math.max(0,Number(w.points)/maxPoints*100)}%`}} /></div>
                <small>{w.label}</small></div>)}
            </div>
          </section>
          <section className="sd-panel"><h2>How active am I?</h2>
            <p>7-day points compared with students sharing at least one study group with you.</p>
            {average===null?<p className="sd-banner">Peer comparison appears once you share groups with at least four other students.</p>:<>
              <div className="sd-comparison"><div><span>You</span><strong>{score}</strong></div><div><span>Peer average</span><strong>{average}</strong></div></div>
              <p className="sd-result">{relative===null?'':relative>=0?`${relative}% above/equal to the group average`:`${Math.abs(relative)}% below the group average`}</p>
            </>}
            <p className="sd-footnote">Activity points measure platform participation—not grades, learning quality, or confirmed attendance. Joining a group = 1 point, session registration = 2, resource save = 1, message = 3, RSVP = 2.</p>
          </section>
        </div>
        <div className="sd-panels">
          <section className="sd-panel"><div className="sd-heading"><h2>Upcoming study sessions</h2><Link to="/sessions">All sessions</Link></div>
            {data?.upcomingSessions.length?data.upcomingSessions.map(session=><div className="sd-list-item" key={session.id}>
              <div><strong>{session.title}</strong><p>{session.groupName} · {new Date(session.startsAt).toLocaleString()}</p></div>
              <label>My RSVP <select aria-label={`RSVP to ${session.title}`} disabled={saving===session.id} value={session.myRsvp||''} onChange={e=>void rsvp(session.id,e.target.value)}>
                <option value="" disabled>Choose</option><option value="attending">Attending</option><option value="maybe">Maybe</option><option value="not_attending">Not attending</option>
              </select></label>
            </div>):<p>No upcoming sessions in your joined groups. <Link to="/groups">Browse groups</Link>.</p>}
          </section>
          <section className="sd-panel"><div className="sd-heading"><h2>Notifications</h2><span>{notices.filter(n=>!n.readAt).length} unread</span></div>
            {notices.length?notices.slice(0,8).map(notice=><div key={notice.id} className={`sd-list-item ${!notice.readAt?'sd-unread':''}`}>
              <div><Link to={notice.href} onClick={()=>void markRead(notice)}><strong>{notice.title}</strong></Link>
                <p>{notice.body}</p><small>{new Date(notice.createdAt).toLocaleString()}</small></div>
              {!notice.readAt?<button type="button" onClick={()=>void markRead(notice)}>Mark read</button>:null}
            </div>):<p>No notifications yet.</p>}
          </section>
        </div>
        <div className="sd-panel sd-actions"><h2>Continue studying</h2><div>
          <Link to="/courses">Explore courses</Link><Link to="/groups">Study groups</Link><Link to="/learning?view=library">Resource library</Link><Link to="/sessions">Schedule</Link>
        </div></div>
      </>:null}
    </div>
  </section>;
}
