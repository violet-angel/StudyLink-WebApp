import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { getStoredUser } from '../lib/session';
import '../styles/student-dashboard.css';

type Message={id:number;senderId:number;senderName?:string;body:string;createdAt:string};
export default function GroupChat(){
  const {id}=useParams<{id:string}>();
  const [messages,setMessages]=useState<Message[]>([]);
  const [body,setBody]=useState('');
  const [error,setError]=useState('');
  const [sending,setSending]=useState(false);
  const me=getStoredUser();
  useEffect(()=>{
    if(!id)return;
    let active=true;
    const reload=async()=>{
      try{
        const response=await apiFetch(`/api/student/messages/${id}`);
        if(!response.ok){const d=await response.json();throw new Error(d.message||'Cannot load messages.');}
        const data=await response.json();if(active){setMessages(data.messages);setError('');}
      }catch(e){if(active)setError(e instanceof Error?e.message:'Network error.');}
    };
    void reload();
    const timer=window.setInterval(()=>void reload(),10000);
    return()=>{active=false;window.clearInterval(timer);};
  },[id]);
  const submit=async(event:FormEvent)=>{
    event.preventDefault();if(!id||!body.trim())return;
    setSending(true);
    try{
      const response=await apiFetch(`/api/student/messages/${id}`,{method:'POST',body:JSON.stringify({body:body.trim()})});
      const data=await response.json();if(!response.ok)throw new Error(data.message||'Could not send message.');
      setMessages(old=>[...old,{...data.message,senderName:me?.name||'You'}]);setBody('');setError('');
    }catch(e){setError(e instanceof Error?e.message:'Network error.');}
    finally{setSending(false);}
  };
  return <section className="workspace-page student-dashboard"><div className="container student-dashboard-stack">
    <header className="sd-hero"><div><p className="sd-eyebrow">Study groups</p><h1>Group conversation</h1>
      <p>Only members of this group can view and send messages. Messages refresh every 10 seconds.</p></div>
      <Link className="button button-secondary" to={`/groups/${id}`}>Back to group</Link></header>
    {error?<p className="sd-error" role="alert">{error}</p>:null}
    <div className="sd-panel" style={{maxHeight:480,overflowY:'auto'}} aria-live="polite">
      {messages.length?messages.map(m=><article key={m.id} className="sd-list-item">
        <div><strong>{Number(m.senderId)===me?.id?'You':m.senderName||'Group member'}</strong>
          <p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{m.body}</p><small>{new Date(m.createdAt).toLocaleString()}</small></div>
      </article>):<p>No messages yet. Start the conversation.</p>}
    </div>
    <form onSubmit={submit} className="sd-panel" style={{display:'flex',gap:12,flexWrap:'wrap'}}>
      <label htmlFor="group-chat-body" style={{width:'100%'}}>Your message</label>
      <textarea id="group-chat-body" rows={3} maxLength={2000} required value={body} onChange={e=>setBody(e.target.value)} style={{flex:'1 1 260px',padding:12,border:'1px solid #cbd5e1',borderRadius:8}}/>
      <button type="submit" className="button button-primary" disabled={sending||!body.trim()}>{sending?'Sending…':'Send message'}</button>
    </form>
  </div></section>;
}
