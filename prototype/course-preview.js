(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const state={course:null,sessions:[],sources:{},index:0,progress:{done:[],answers:{}},blockElements:{}};
  const avatar={running:false,token:0,audio:null,abort:null};
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
  function avatarPost(message){const frame=$('avatarFrame');if(frame&&frame.contentWindow)frame.contentWindow.postMessage(message,'*')}
  function avatarPose(type){const map={image:['point','curious'],schema:['point','curious'],video:['explain','neutral'],question:['think','curious'],evaluation:['think','curious'],summary:['nod','happy'],activity:['explain','happy']},pose=map[type]||['explain','neutral'];avatarPost({type:'gesture',name:pose[0]});avatarPost({type:'emotion',name:pose[1]})}
  function resetAvatarButton(){avatar.running=false;$('avatarStartBtn').classList.remove('running');$('avatarStartBtn').textContent='▶ Explication par l’avatar'}
  function stopAvatarLesson(hide=true){avatar.token++;if(avatar.abort){try{avatar.abort.abort()}catch(e){}avatar.abort=null}if(avatar.audio){try{avatar.audio.pause();avatar.audio.src=''}catch(e){}avatar.audio=null}try{speechSynthesis.cancel()}catch(e){}avatarPost({type:'speak',on:false});document.querySelectorAll('.block.speaking').forEach(el=>el.classList.remove('speaking'));resetAvatarButton();if(hide)$('avatarCoach').hidden=true}
  function browserNarration(text,token){return new Promise(resolve=>{if(!window.speechSynthesis||token!==avatar.token)return resolve();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='fr-FR';utterance.rate=.84;utterance.pitch=1.02;utterance.onstart=()=>avatarPost({type:'speak',on:true});utterance.onend=utterance.onerror=()=>{avatarPost({type:'speak',on:false});resolve()};try{speechSynthesis.speak(utterance)}catch(e){resolve()}})}
  async function playNarration(text,token){
    if(token!==avatar.token)return;avatar.abort=new AbortController();
    try{const response=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text}),signal:avatar.abort.signal});if(response.status===204||!response.ok)throw new Error('fallback');const blob=await response.blob();if(!blob.size)throw new Error('fallback');if(token!==avatar.token)return;const url=URL.createObjectURL(blob);await new Promise(resolve=>{const audio=new Audio(url);avatar.audio=audio;audio.onplay=()=>avatarPost({type:'speak',on:true});audio.onended=()=>{avatarPost({type:'speak',on:false});URL.revokeObjectURL(url);avatar.audio=null;resolve()};audio.onerror=()=>{avatarPost({type:'speak',on:false});URL.revokeObjectURL(url);avatar.audio=null;resolve()};audio.play().catch(()=>{URL.revokeObjectURL(url);avatar.audio=null;browserNarration(text,token).then(resolve)})})}
    catch(error){if(error&&error.name==='AbortError')return;await browserNarration(text,token)}finally{avatar.abort=null}
  }
  function narration(block,index,total){const lead=block.type==='image'?'Observe attentivement cette image. ':block.type==='schema'?'Regardons ensemble l’organisation montrée par ce schéma. ':block.type==='video'?'Cette vidéo nous aide à comprendre le processus. ':block.type==='simulation'?'Manipule cette simulation et observe le résultat. ':block.type==='question'||block.type==='evaluation'?'Vérifions maintenant ta compréhension. ':block.type==='summary'?'Retenons l’essentiel. ':block.type==='activity'?'Passons à l’activité. ':'';return (`Partie ${index+1} sur ${total}. ${block.title}. ${lead}${block.text||block.objective||''}`).replace(/\s+/g,' ').trim().slice(0,1900)}
  async function explainWithAvatar(block,index,total,token){if(token!==avatar.token)return;const article=state.blockElements[block.id];document.querySelectorAll('.block.speaking').forEach(el=>el.classList.remove('speaking'));if(article){article.classList.add('speaking');article.scrollIntoView({behavior:'smooth',block:'center'})}avatarPose(block.type);$('avatarState').textContent=`${index+1}/${total} · ${TYPE[block.type]&&TYPE[block.type][1]||'Explication'}`;$('avatarSpeech').textContent=block.title;$('avatarCoach').hidden=false;await playNarration(narration(block,index,total),token);if(article)article.classList.remove('speaking')}
  async function startAvatarLesson(){
    if(avatar.running)return stopAvatarLesson();const session=state.sessions[state.index];if(!session||!session.blocks.length)return;
    stopAvatarLesson(false);avatar.running=true;const token=++avatar.token;$('avatarCoach').hidden=false;$('avatarStartBtn').classList.add('running');$('avatarStartBtn').textContent='■ Arrêter l’avatar';
    for(let index=0;index<session.blocks.length;index++){if(!avatar.running||token!==avatar.token)return;await explainWithAvatar(session.blocks[index],index,session.blocks.length,token)}
    if(token!==avatar.token)return;resetAvatarButton();avatarPost({type:'gesture',name:'clap'});avatarPost({type:'emotion',name:'happy'});$('avatarState').textContent='Séance terminée';$('avatarSpeech').textContent='Bravo ! Tu peux revoir un bloc ou passer à la séance suivante.';
  }
  async function explainOne(block){stopAvatarLesson(false);avatar.running=true;const token=++avatar.token;$('avatarStartBtn').classList.add('running');$('avatarStartBtn').textContent='■ Arrêter l’avatar';await explainWithAvatar(block,0,1,token);if(token===avatar.token)resetAvatarButton()}
  async function render(){
    const session=state.sessions[state.index];if(!session)return;
    document.querySelectorAll('.session-button').forEach((button,index)=>button.classList.toggle('active',index===state.index));
    $('sessionEyebrow').textContent=`Séance ${state.index+1} sur ${state.sessions.length} · ${session.duration} min`;$('sessionTitle').textContent=session.title;$('sessionObjective').textContent=session.objective||'Objectif de la séance';
    const zone=$('blocks');zone.innerHTML='';state.blockElements={};
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
      const actions=document.createElement('div');actions.className='block-actions';const explain=document.createElement('button');explain.className='explain-block';explain.type='button';explain.textContent='▶ Expliquer par l’avatar';explain.onclick=()=>explainOne(block);const complete=document.createElement('button');complete.className='complete '+(done?'done':'');complete.type='button';complete.textContent=done?'✓ Terminé':'Marquer comme terminé';
      complete.onclick=()=>{const set=new Set(state.progress.done||[]);set.has(block.id)?set.delete(block.id):set.add(block.id);state.progress.done=[...set];saveProgress();render()};actions.append(explain,complete);article.appendChild(actions);zone.appendChild(article);state.blockElements[block.id]=article;
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
      const {data:{session}}=await sb.auth.getSession();
      const [{data:course,error:courseError},{data:imports,error:importError},{data:sources,error:sourceError},{data:blocks,error:blockError}]=await Promise.all([
        sb.from('courses').select('id,teacher_id,title,description,status,settings').eq('id',courseId).single(),sb.from('course_imports').select('analysis,duration_minutes,created_at').eq('course_id',courseId).order('created_at',{ascending:false}).limit(1),sb.from('course_sources').select('id,file_name,kind,storage_path').eq('course_id',courseId),sb.from('course_blocks').select('id,session_position,position,block_type,title,duration_minutes,objective,content,source_id,status').eq('course_id',courseId).order('session_position',{ascending:true}).order('position',{ascending:true})
      ]);
      if(courseError)throw courseError;if(importError)throw importError;if(sourceError)throw sourceError;if(blockError)throw blockError;if(session&&session.user&&session.user.id!==course.teacher_id)throw new Error('Ce cours appartient à un autre professeur.');state.course=course;
      try{state.progress=JSON.parse(localStorage.getItem(progressKey()))||{done:[],answers:{}}}catch(e){state.progress={done:[],answers:{}}}
      (sources||[]).forEach(source=>state.sources[source.id]=source);state.sessions=buildSessions(blocks||[],imports&&imports[0]&&imports[0].analysis||{});if(!state.sessions.length)throw new Error('Ce cours ne contient encore aucune séance.');
      const owner=!!(session&&session.user&&session.user.id===course.teacher_id);if(owner){$('teacherBack').hidden=false;$('editLink').hidden=false;$('logoutBtn').hidden=false;$('logoutBtn').onclick=async()=>{await sb.auth.signOut();location.reload()}}
      $('editLink').href='course-import.html?course='+encodeURIComponent(courseId);$('shareBtn').hidden=course.status!=='published';$('shareBtn').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('shareBtn').textContent='Lien copié ✓';setTimeout(()=>$('shareBtn').textContent='Partager le cours',1800)}catch(e){prompt('Copiez ce lien :',location.href)}};$('sideTitle').textContent=course.title;$('courseStatus').textContent=course.status==='published'?'Cours publié':'Brouillon';$('courseStatus').classList.toggle('draft',course.status!=='published');
      const nav=$('sessionNav');state.sessions.forEach((courseSession,index)=>{const button=document.createElement('button');button.className='session-button';button.innerHTML=`<b>${index+1}. ${safe(courseSession.title)}</b><small>${courseSession.duration} min · ${courseSession.blocks.length} blocs</small>`;button.onclick=()=>{stopAvatarLesson();state.index=index;render()};nav.appendChild(button)});
      $('prevSession').onclick=()=>{if(state.index>0){stopAvatarLesson();state.index--;render()}};$('nextSession').onclick=()=>{if(state.index<state.sessions.length-1){stopAvatarLesson();state.index++;render()}};$('avatarStartBtn').disabled=false;$('avatarStartBtn').onclick=startAvatarLesson;$('avatarClose').onclick=()=>stopAvatarLesson();$('loading').hidden=true;$('app').hidden=false;render();
    }catch(error){$('loading').textContent='Ce cours est introuvable, privé ou non encore publié.'}
  }
  init();
})();
