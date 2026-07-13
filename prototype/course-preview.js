(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const state={course:null,sessions:[],sources:{},index:0,progress:{done:[],answers:{}}};
  const TYPE={text:['T','Texte'],image:['IM','Image'],video:['▶','Vidéo'],simulation:['SIM','Simulation'],activity:['A','Activité'],question:['?','Question'],summary:['Σ','Synthèse'],evaluation:['✓','Évaluation'],schema:['SC','Schéma']};
  function safe(value){return String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
  function progressKey(){return'cc_course_progress_'+state.course.id}
  function saveProgress(){localStorage.setItem(progressKey(),JSON.stringify(state.progress));updateProgress()}
  function updateProgress(){
    const all=state.sessions.flatMap(session=>session.blocks),done=new Set(state.progress.done||[]),percent=all.length?Math.round(all.filter(block=>done.has(block.id)).length/all.length*100):0;
    $('progressBar').style.width=percent+'%';$('sideMeta').textContent=(state.course.description||'')+' · '+percent+'% terminé';
  }
  async function signedUrl(source){
    if(!source||!source.storage_path)return'';if(source.url)return source.url;
    const {data,error}=await window.classesSupabase.storage.from('course-media').createSignedUrl(source.storage_path,3600);if(error)return'';source.url=data.signedUrl;return source.url;
  }
  async function render(){
    const session=state.sessions[state.index];if(!session)return;
    document.querySelectorAll('.session-button').forEach((button,index)=>button.classList.toggle('active',index===state.index));
    $('sessionEyebrow').textContent=`Séance ${state.index+1} sur ${state.sessions.length} · ${session.duration} min`;$('sessionTitle').textContent=session.title;$('sessionObjective').textContent=session.objective||'Objectif de la séance';
    const zone=$('blocks');zone.innerHTML='';
    for(const block of session.blocks){
      const info=TYPE[block.type]||TYPE.text,done=(state.progress.done||[]).includes(block.id),article=document.createElement('article');
      article.className='block '+(done?'done ':'')+(block.type==='question'||block.type==='evaluation'?'question ':'')+(block.type==='summary'?'summary':'');
      article.innerHTML=`<div class="block-head"><span class="type">${info[0]}</span><div class="block-title"><h2>${safe(block.title)}</h2><small>${safe(block.objective||info[1])}</small></div><span class="duration">${block.duration} min</span></div><div class="content">${safe(block.text)}</div>`;
      const source=state.sources[block.sourceId];
      if(source){const url=await signedUrl(source);if(url){const media=document.createElement('div');media.className='media';if(block.type==='image'||block.type==='schema')media.innerHTML=`<img src="${safe(url)}" alt="${safe(source.file_name)}">`;else if(block.type==='video')media.innerHTML=`<video src="${safe(url)}" controls preload="metadata"></video>`;else media.innerHTML=`<a class="media-link" href="${safe(url)}" target="_blank" rel="noopener"><span>${safe(source.file_name)}</span><b>Ouvrir la ressource →</b></a>`;article.appendChild(media)}}
      if(block.type==='question'||block.type==='evaluation'){
        const answer=document.createElement('div');answer.className='answer-area';answer.innerHTML=`<label>Ma réponse</label><textarea placeholder="Écris ta réponse ici…">${safe(state.progress.answers&&state.progress.answers[block.id]||'')}</textarea>`;
        answer.querySelector('textarea').oninput=e=>{state.progress.answers=state.progress.answers||{};state.progress.answers[block.id]=e.target.value;localStorage.setItem(progressKey(),JSON.stringify(state.progress))};article.appendChild(answer);
      }
      const actions=document.createElement('div');actions.className='block-actions';const complete=document.createElement('button');complete.className='complete '+(done?'done':'');complete.type='button';complete.textContent=done?'✓ Terminé':'Marquer comme terminé';
      complete.onclick=()=>{const set=new Set(state.progress.done||[]);set.has(block.id)?set.delete(block.id):set.add(block.id);state.progress.done=[...set];saveProgress();render()};actions.appendChild(complete);article.appendChild(actions);zone.appendChild(article);
    }
    if(!session.blocks.length)zone.innerHTML='<div class="empty">Cette séance ne contient aucun bloc visible.</div>';
    $('prevSession').disabled=state.index===0;$('nextSession').disabled=state.index===state.sessions.length-1;updateProgress();
  }
  function buildSessions(blocks,analysis){
    const grouped={};blocks.forEach(block=>(grouped[block.session_position]||(grouped[block.session_position]=[])).push(block));
    return Object.keys(grouped).map(Number).sort((a,b)=>a-b).map((position,index)=>{const template=analysis&&analysis.sessions&&analysis.sessions[position]||{},rows=grouped[position],content=rows[0].content||{};return{title:content.session_title||template.title||`Séance ${index+1}`,objective:template.objective||'',duration:Number(content.session_duration_minutes)||Number(template.durationMinutes)||rows.reduce((n,row)=>n+Number(row.duration_minutes||0),0),blocks:rows.map(row=>({id:row.id,type:row.block_type,title:row.title,objective:row.objective,text:row.content&&row.content.text||'',duration:Number(row.duration_minutes)||5,sourceId:row.source_id}))}})
  }
  async function init(){
    try{
      await window.teacherAuthReady;const sb=window.classesSupabase,courseId=new URLSearchParams(location.search).get('course');if(!/^[0-9a-f-]{36}$/i.test(courseId||''))throw new Error('Cours invalide.');
      const {data:{session}}=await sb.auth.getSession();if(session){$('teacherBack').hidden=false;$('editLink').hidden=false;$('logoutBtn').hidden=false;$('logoutBtn').onclick=async()=>{await sb.auth.signOut();location.reload()}}
      const [{data:course,error:courseError},{data:imports,error:importError},{data:sources,error:sourceError},{data:blocks,error:blockError}]=await Promise.all([
        sb.from('courses').select('id,title,description,status,settings').eq('id',courseId).single(),sb.from('course_imports').select('analysis,duration_minutes,created_at').eq('course_id',courseId).order('created_at',{ascending:false}).limit(1),sb.from('course_sources').select('id,file_name,kind,storage_path').eq('course_id',courseId),sb.from('course_blocks').select('id,session_position,position,block_type,title,duration_minutes,objective,content,source_id,status').eq('course_id',courseId).order('session_position',{ascending:true}).order('position',{ascending:true})
      ]);
      if(courseError)throw courseError;if(importError)throw importError;if(sourceError)throw sourceError;if(blockError)throw blockError;state.course=course;
      try{state.progress=JSON.parse(localStorage.getItem(progressKey()))||{done:[],answers:{}}}catch(e){state.progress={done:[],answers:{}}}
      (sources||[]).forEach(source=>state.sources[source.id]=source);state.sessions=buildSessions(blocks||[],imports&&imports[0]&&imports[0].analysis||{});if(!state.sessions.length)throw new Error('Ce cours ne contient encore aucune séance.');
      $('editLink').href='course-import.html?course='+encodeURIComponent(courseId);$('shareBtn').hidden=course.status!=='published';$('shareBtn').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('shareBtn').textContent='Lien copié ✓';setTimeout(()=>$('shareBtn').textContent='Partager le cours',1800)}catch(e){prompt('Copiez ce lien :',location.href)}};$('sideTitle').textContent=course.title;$('courseStatus').textContent=course.status==='published'?'Cours publié':'Brouillon';$('courseStatus').classList.toggle('draft',course.status!=='published');
      const nav=$('sessionNav');state.sessions.forEach((session,index)=>{const button=document.createElement('button');button.className='session-button';button.innerHTML=`<b>${index+1}. ${safe(session.title)}</b><small>${session.duration} min · ${session.blocks.length} blocs</small>`;button.onclick=()=>{state.index=index;render()};nav.appendChild(button)});
      $('prevSession').onclick=()=>{if(state.index>0){state.index--;render()}};$('nextSession').onclick=()=>{if(state.index<state.sessions.length-1){state.index++;render()}};$('loading').hidden=true;$('app').hidden=false;render();
    }catch(error){$('loading').textContent='Ce cours est introuvable, privé ou non encore publié.'}
  }
  init();
})();
