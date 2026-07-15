(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const BLOCK_TYPES={
    text:{label:'Texte',icon:'T'},image:{label:'Image',icon:'IM'},video:{label:'Vidéo',icon:'▶'},simulation:{label:'Simulation',icon:'SIM'},
    activity:{label:'Activité',icon:'A'},question:{label:'Question',icon:'?'},summary:{label:'Synthèse',icon:'Σ'},evaluation:{label:'Évaluation',icon:'✓'},schema:{label:'Schéma',icon:'SC'}
  };
  const state={stage:1,pdf:null,resources:[],removedSources:[],assignments:[],plan:null,selected:null,saving:false,courseId:'',importId:'',persistedBlocks:[]};

  function toast(message,error){const el=$('toast');el.textContent=message;el.className='toast show'+(error?' error':'');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='toast',2800)}
  function bytes(size){if(size<1024)return size+' o';if(size<1048576)return (size/1024).toFixed(1)+' Ko';return (size/1048576).toFixed(1)+' Mo'}
  function uid(prefix){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
  function escapeHtml(value){return String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
  function resourceKind(file){
    const n=file.name.toLowerCase(),t=file.type||'';
    if(t.startsWith('image/'))return /schema|schéma|diagram/.test(n)?'schema':'image';
    if(t.startsWith('video/'))return 'video';
    if(t.startsWith('audio/'))return 'audio';
    if(/\.(html?|zip|json|gltf|glb|fbx)$/.test(n))return 'simulation';
    return 'other';
  }
  function defaultObjective(kind){return ({image:'Observer ou identifier',schema:'Comprendre une organisation',video:'Comprendre un mouvement ou un processus',simulation:'Manipuler et expérimenter',audio:'Écouter et reconnaître',other:'Soutenir l’activité'})[kind]}
  function iconLabel(kind){return ({image:'IMG',schema:'SCH',video:'VID',simulation:'SIM',audio:'AUD',other:'DOC'})[kind]||'DOC'}
  function resourceName(resource){return resource.file?resource.file.name:String(resource.name||'')}
  function resourceSize(resource){return resource.file?resource.file.size:Number(resource.size||0)}
  function resourceMime(resource){return resource.file?(resource.file.type||'application/octet-stream'):String(resource.mimeType||'application/octet-stream')}

  function setStage(number){
    state.stage=number;
    document.querySelectorAll('.stage').forEach(el=>el.classList.toggle('active',Number(el.dataset.stage)===number));
    document.querySelectorAll('.nav-step').forEach(el=>el.classList.toggle('active',Number(el.dataset.goStage)===number));
    window.scrollTo({top:0,behavior:'smooth'});
    if(number===3)renderPublish();
  }
  document.querySelectorAll('[data-go-stage]').forEach(btn=>btn.addEventListener('click',()=>{if(!btn.disabled)setStage(Number(btn.dataset.goStage))}));

  function bindDropzone(zone,input,handler){
    ['dragenter','dragover'].forEach(type=>zone.addEventListener(type,e=>{e.preventDefault();zone.classList.add('dragover')}));
    ['dragleave','drop'].forEach(type=>zone.addEventListener(type,e=>{e.preventDefault();zone.classList.remove('dragover')}));
    zone.addEventListener('drop',e=>handler([...e.dataTransfer.files]));
    input.addEventListener('change',()=>{handler([...input.files]);input.value=''})
  }
  function setPdf(files){
    const file=files[0];if(!file)return;
    if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf'))return toast('Le document principal doit être un PDF.',true);
    if(file.size>20*1024*1024)return toast('Le PDF ne doit pas dépasser 20 Mo.',true);
    state.pdf=file;renderPdf();updateSourceSummary();
  }
  function renderPdf(){
    const card=$('pdfFileCard');
    if(!state.pdf){card.hidden=true;card.innerHTML='';return}
    card.hidden=false;card.innerHTML=`<span class="file-icon">PDF</span><span class="file-meta"><b>${escapeHtml(state.pdf.name)}</b><small>${bytes(state.pdf.size)} · prêt pour l’analyse</small></span><button class="remove-file" type="button" aria-label="Retirer">×</button>`;
    card.querySelector('button').onclick=()=>{state.pdf=null;renderPdf();updateSourceSummary()};
  }
  function addResources(files){
    const duplicates=new Set(state.resources.map(x=>resourceName(x)+'_'+resourceSize(x)));
    files.forEach(file=>{const key=file.name+'_'+file.size;if(duplicates.has(key))return;duplicates.add(key);const kind=resourceKind(file);state.resources.push({id:uid('res'),file,kind,objective:defaultObjective(kind)})});
    renderResources();updateSourceSummary();
  }
  function renderResources(){
    const lists=[$('resourceList'),$('studioResourceList')].filter(Boolean);lists.forEach(list=>list.innerHTML='');
    lists.forEach(list=>state.resources.forEach(resource=>{
      const card=document.createElement('div');card.className='resource-card';
      card.innerHTML=`<span class="resource-kind">${iconLabel(resource.kind)}</span><span class="resource-info"><b>${escapeHtml(resourceName(resource))}</b><small>${bytes(resourceSize(resource))} · ${escapeHtml(resource.kind)}</small></span><select class="resource-objective" aria-label="Objectif pédagogique"><option>Observer ou identifier</option><option>Comprendre un mouvement ou un processus</option><option>Manipuler et expérimenter</option><option>Comprendre une organisation</option><option>Vérifier la compréhension</option><option>Écouter et reconnaître</option><option>Soutenir l’activité</option></select><button class="remove-file" type="button" aria-label="Retirer">×</button>`;
      const select=card.querySelector('select');select.value=resource.objective;select.onchange=()=>resource.objective=select.value;
      card.querySelector('button').onclick=()=>{if(resource.dbId&&!confirm('Retirer ce support du cours ?'))return;if(resource.dbId&&!state.removedSources.some(x=>x.id===resource.dbId))state.removedSources.push({id:resource.dbId,storagePath:resource.storagePath||''});const removedName=resourceName(resource);state.resources=state.resources.filter(x=>x.id!==resource.id);if(state.plan)(state.plan.sessions||[]).flatMap(s=>s.blocks||[]).forEach(block=>{if(block.resourceName===removedName)block.resourceName=''});renderResources();updateSourceSummary();if(state.plan)renderPlan()};list.appendChild(card);
    }));
  }
  function updateSourceSummary(){
    const assignment=state.assignments.find(x=>x.id===$('assignment').value),ready=!!state.pdf&&!!assignment;
    $('analyzeBtn').disabled=!ready;
    const target=assignment?`${assignment.subjects&&assignment.subjects.name||'Matière'} · ${assignment.grade_levels&&assignment.grade_levels.name||'Niveau'}`:'';
    $('assignmentGuard').innerHTML=assignment?`Cible verrouillée : <strong>${escapeHtml(target)}</strong>. Un PDF d’une autre matière ou année sera bloqué.`:'Choisissez la matière et l’année exactes du cours.';
    $('sourceSummary').textContent=state.pdf?`${state.resources.length} ressource${state.resources.length>1?'s':''} ajoutée${state.resources.length>1?'s':''} · ${target||'PDF prêt'}`:'Ajoutez le PDF pour commencer';
  }
  bindDropzone($('pdfDropzone'),$('pdfInput'),setPdf);bindDropzone($('resourceDropzone'),$('resourceInput'),addResources);
  $('addExistingResourcesBtn').onclick=()=>$('resourceInput').click();

  function adjustDuration(delta){const input=$('durationHours');input.value=Math.min(12,Math.max(1,(Number(input.value)||1)+delta));}
  $('durationMinus').onclick=()=>adjustDuration(-.5);$('durationPlus').onclick=()=>adjustDuration(.5);

  async function fileAsBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('Lecture impossible : '+file.name));r.onload=()=>resolve(String(r.result).split(',')[1]);r.readAsDataURL(file)})}
  async function resourceForAnalysis(resource,budget){
    const out={id:resource.id,name:resourceName(resource),mimeType:resourceMime(resource),size:resourceSize(resource),kind:resource.kind,objective:resource.objective};
    const analyzable=/^(image|video|audio)\//.test(out.mimeType)||/^(text\/html|application\/json)$/.test(out.mimeType);
    if(resource.file&&analyzable&&resourceSize(resource)<=budget.remaining&&resourceSize(resource)<=5*1024*1024){out.data=await fileAsBase64(resource.file);budget.remaining-=resourceSize(resource)}
    return out;
  }
  function startLoading(){
    $('loadingOverlay').hidden=false;let progress=10,index=0;const messages=['Lecture du PDF et repérage des ressources','Identification des objectifs pédagogiques','Découpage en blocs standardisés','Scénarisation avatar, tableau, médias et activités','Calcul du rythme et préparation de la supervision','L’IA rédige un cours de qualité : cela peut prendre plusieurs minutes, merci de patienter'];
    $('loadingMessage').textContent=messages[0];$('loadingProgress').style.width='10%';
    startLoading.timer=setInterval(()=>{progress=Math.min(90,progress+Math.random()*13);index=Math.min(messages.length-1,Math.floor(progress/16));$('loadingProgress').style.width=progress+'%';$('loadingMessage').textContent=messages[index]},850);
  }
  function stopLoading(){clearInterval(startLoading.timer);$('loadingProgress').style.width='100%';setTimeout(()=>$('loadingOverlay').hidden=true,250)}
  function normalizePlan(raw){
    const requestedMinutes=Math.round(Math.min(12,Math.max(1,Number($('durationHours').value)||1))*60);
    const plan=raw&&typeof raw==='object'?raw:{};plan.courseTitle=String(plan.courseTitle||$('courseTitle').value||(state.pdf&&state.pdf.name||'Cours').replace(/\.pdf$/i,''));plan.totalDurationMinutes=state.courseId?(Number(plan.totalDurationMinutes)||requestedMinutes):requestedMinutes;plan.summary=String(plan.summary||'Cours structuré à partir de la préparation du professeur.');plan.warnings=Array.isArray(plan.warnings)?plan.warnings:[];
    plan.sessions=Array.isArray(plan.sessions)?plan.sessions:[];plan.sessions.forEach((session,si)=>{session.id=session.id||uid('session');session.title=String(session.title||`Séance ${si+1}`);session.durationMinutes=Math.max(1,Number(session.durationMinutes)||60);session.explanationMinutes=Math.max(0,Number(session.explanationMinutes)||Math.round(session.durationMinutes*.3));session.objective=String(session.objective||'');session.blocks=Array.isArray(session.blocks)?session.blocks:[];session.blocks.forEach(block=>{block.id=block.id||uid('block');block.type=BLOCK_TYPES[block.type]?block.type:'text';block.title=String(block.title||BLOCK_TYPES[block.type].label);block.durationMinutes=Math.max(1,Number(block.durationMinutes)||5);block.objective=String(block.objective||'');block.content=typeof block.content==='string'?block.content:JSON.stringify(block.content||'');block.resourceName=String(block.resourceName||'');block.presentation=block.presentation&&typeof block.presentation==='object'?block.presentation:null;block.activity=block.activity&&typeof block.activity==='object'?block.activity:null;block.simulation=block.simulation&&typeof block.simulation==='object'?block.simulation:null;block.image=block.image&&typeof block.image==='object'?block.image:null;block.evaluation=block.evaluation&&typeof block.evaluation==='object'?block.evaluation:null;block.teacherNote=String(block.teacherNote||'');block.validated=!!block.validated})});
    return plan;
  }
  async function analyze(){
    if(!state.pdf)return;const assignment=state.assignments.find(x=>x.id===$('assignment').value);if(!assignment)return toast('Choisissez une matière et un niveau.',true);
    $('analyzeBtn').disabled=true;startLoading();
    try{
      const pdfData=await fileAsBase64(state.pdf),budget={remaining:Math.max(0,15*1024*1024-state.pdf.size)},resources=[];
      for(const resource of state.resources)resources.push(await resourceForAnalysis(resource,budget));
      const token=window.currentTeacher&&window.currentTeacher.session&&window.currentTeacher.session.access_token;
      // Délai limite global (13 min) : la génération de qualité peut être longue, mais
      // l'écran ne doit jamais rester bloqué pour toujours si le serveur ne répond plus.
      const response=await fetch('/api/analyze-course-import',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},signal:AbortSignal.timeout(13*60*1000),body:JSON.stringify({pdf:{name:state.pdf.name,mimeType:'application/pdf',data:pdfData},resources,request:{assignmentId:assignment.id,title:$('courseTitle').value.trim(),durationHours:Number($('durationHours').value),teacherInstructions:$('teacherInstructions').value.trim()}})}).catch(error=>{throw new Error(error&&(error.name==='TimeoutError'||error.name==='AbortError')?'L’analyse a dépassé le délai maximum. Réessayez, ou réduisez la taille du PDF / la durée demandée.':'Serveur inaccessible : vérifiez que le serveur tourne, puis réessayez.')});
      const body=await response.json();if(!response.ok)throw new Error(body.error||'Analyse impossible');state.plan=normalizePlan(body);
      await generateMissingImages(token);
      await generateMissingSimulations(token);
      enablePlanStages();renderPlan();
      stopLoading();toast('Cours structuré. Ouverture directe des tableaux…');
      await saveCourse(false,{openBoards:true});
    }catch(error){toast(error.message||'Analyse impossible.',true)}finally{stopLoading();updateSourceSummary()}
  }
  $('analyzeBtn').onclick=analyze;
  function fileFromBase64(data,fileName,mimeType){
    const bytes=atob(String(data||'')),array=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)array[i]=bytes.charCodeAt(i);
    return new File([array],fileName,{type:mimeType||'application/octet-stream'});
  }
  async function generateMissingImages(token){
    const targets=allBlocks().filter(block=>(block.type==='image'||block.type==='schema')&&!block.resourceName&&block.image&&block.image.useful===true).slice(0,Math.max(0,Number(window.OPENAI_MAX_COURSE_IMAGES)||4));
    for(const block of targets){
      $('loadingMessage').textContent='Création de l’illustration utile : '+block.title;
      try{
        const response=await fetch('/api/generate-course-image',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({title:block.title,image:block.image,targetContext:state.plan.targetContext||null})});
        const out=await response.json();if(!response.ok)throw new Error(out.error||'génération impossible');
        const file=fileFromBase64(out.data,out.fileName,out.mimeType);
        state.resources.push({id:uid('res'),file,kind:block.type==='schema'?'schema':'image',objective:block.objective||block.image.reason||'Observer et identifier'});block.resourceName=out.fileName;
      }catch(error){state.plan.warnings.push('Image non générée pour « '+block.title+' » : '+error.message);}
    }
    if(targets.length)renderResources();
  }
  // Pour chaque bloc simulation sans ressource importée, l'IA fabrique une page HTML
  // interactive (énoncé, curseurs, schéma SVG, observations) ajoutée comme ressource du
  // cours et associée au bloc. Un échec sur une simulation n'interrompt pas l'import.
  async function generateMissingSimulations(token){
    const targets=allBlocks().filter(block=>block.type==='simulation'&&!block.resourceName&&block.simulation);
    for(const block of targets.slice(0,6)){
      $('loadingMessage').textContent='Création de la simulation interactive : '+block.title;
      try{
        const response=await fetch('/api/generate-simulation',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({title:block.title,objective:block.objective,content:block.content,simulation:block.simulation,targetContext:state.plan.targetContext||null})});
        const out=await response.json();if(!response.ok)throw new Error(out.error||'génération impossible');if(out.warning)state.plan.warnings.push(out.warning);
        const file=new File([out.html],out.fileName,{type:'text/html'});
        state.resources.push({id:uid('res'),file,kind:'simulation',objective:block.simulation.goal||'Manipuler et expérimenter'});
        block.resourceName=out.fileName;
      }catch(error){console.warn('Simulation non générée ('+block.title+') :',error.message)}
    }
    if(targets.length)renderResources();
  }
  function enablePlanStages(){document.querySelector('[data-go-stage="2"]').disabled=false;document.querySelector('[data-go-stage="3"]').disabled=false}

  function allBlocks(){return (state.plan&&state.plan.sessions||[]).flatMap(s=>s.blocks||[])}
  function planStats(){const blocks=allBlocks(),duration=(state.plan.sessions||[]).reduce((n,s)=>n+Number(s.durationMinutes||0),0),explanation=(state.plan.sessions||[]).reduce((n,s)=>n+Number(s.explanationMinutes||0),0),validated=blocks.filter(b=>b.validated).length,associated=state.resources.length?state.resources.every(r=>blocks.some(b=>b.resourceName===resourceName(r))):true;return{blocks,duration,explanation,validated,associated,ratio:blocks.length?Math.round(validated/blocks.length*100):0}}
  function renderPlan(){
    const plan=state.plan;if(!plan)return;
    $('planTitle').textContent=plan.courseTitle;
    const stats=planStats();
    const target=plan.targetContext?`${plan.targetContext.subjectName} · ${plan.targetContext.gradeLevelName}`:'';
    $('planMeta').textContent=`${target?target+' · ':''}${plan.sessions.length} séance${plan.sessions.length>1?'s':''} · ${Math.round(plan.totalDurationMinutes/60*10)/10} h demandées · ${stats.blocks.length} blocs`;
    const warnings=$('planWarnings');warnings.hidden=!plan.warnings.length;warnings.innerHTML=plan.warnings.map(w=>'• '+escapeHtml(w)).join('<br>');
    const list=$('sessionsList');list.innerHTML='';
    plan.sessions.forEach((session,index)=>{
      const card=document.createElement('article');card.className='session-card';
      card.innerHTML=`<div class="session-head"><span class="session-index">${index+1}</span><div class="session-title"><h3>${escapeHtml(session.title)}</h3><p>${escapeHtml(session.objective)}</p></div><span class="time-pill">${session.durationMinutes} min · ${session.explanationMinutes} min d’explication</span></div><div class="blocks-list"></div>`;
      const blocks=card.querySelector('.blocks-list');
      session.blocks.forEach(block=>{
        const row=document.createElement('div');row.className='block-row';
        row.innerHTML=`<span class="block-type-icon">${BLOCK_TYPES[block.type].icon}</span><span class="block-copy"><b>${escapeHtml(block.title)}</b><small>${escapeHtml(block.objective||BLOCK_TYPES[block.type].label)} · ${block.durationMinutes} min</small></span>${block.resourceName?`<span class="block-resource" title="${escapeHtml(block.resourceName)}">${escapeHtml(block.resourceName)}</span>`:'<span></span>'}<button class="validate-button ${block.validated?'valid':''}" type="button" title="${block.validated?'Validé':'Valider'}">${block.validated?'✓':'○'}</button>`;
        row.onclick=e=>{if(e.target.closest('.validate-button'))return;openBlock(session,block)};
        row.querySelector('.validate-button').onclick=()=>{block.validated=!block.validated;renderPlan()};
        blocks.appendChild(row);
      });
      const add=document.createElement('button');add.className='add-block-button';add.type='button';add.textContent='+ Ajouter un bloc';
      add.onclick=()=>{const block={id:uid('block'),type:'text',title:'Nouveau bloc',durationMinutes:5,objective:'',content:'',resourceName:'',teacherNote:'',validated:false};session.blocks.push(block);renderPlan();openBlock(session,block)};
      blocks.appendChild(add);list.appendChild(card);
    });
    renderQuality();
  }
  function renderQuality(){
    const s=planStats(),expected=state.plan.totalDurationMinutes,hours=expected/60,explanationOk=s.explanation>=hours*15&&s.explanation<=hours*20,durationOk=Math.abs(s.duration-expected)<=5,blocksOk=s.blocks.length>0&&s.validated===s.blocks.length;
    $('qualityScore').textContent=s.ratio+'%';$('scoreRing').style.background=`conic-gradient(var(--lime) ${s.ratio}%,#31463e ${s.ratio}%)`;
    [['checkDuration',durationOk],['checkExplanation',explanationOk],['checkResources',s.associated],['checkBlocks',blocksOk]].forEach(([id,ok])=>{const el=$(id);el.classList.toggle('ok',ok);el.querySelector('span').textContent=ok?'✓':'○'});
  }
  $('validateAllBtn').onclick=()=>{allBlocks().forEach(b=>b.validated=true);renderPlan();toast('Tous les blocs sont validés.')};
  $('backToSources').onclick=()=>state.courseId?location.href='prof.html':setStage(1);
  $('editCourseInfoBtn').onclick=()=>{if(!state.plan)return;const title=prompt('Titre du cours :',state.plan.courseTitle);if(title===null)return;const summary=prompt('Résumé du cours :',state.plan.summary||'');if(summary===null)return;state.plan.courseTitle=title.trim()||state.plan.courseTitle;state.plan.summary=summary.trim();renderPlan();toast('Informations du cours modifiées.')};
  $('goPublishBtn').onclick=()=>setStage(3);$('returnSupervision').onclick=()=>setStage(2);

  function openBlock(session,block){
    state.selected={session,block};$('drawerTitle').textContent=block.title;const type=$('editBlockType');type.innerHTML=Object.entries(BLOCK_TYPES).map(([value,x])=>`<option value="${value}">${x.label}</option>`).join('');type.value=block.type;$('editBlockTitle').value=block.title;$('editBlockObjective').value=block.objective;$('editBlockDuration').value=block.durationMinutes;$('editBlockContent').value=block.content;$('editTeacherNote').value=block.teacherNote||'';
    const res=$('editBlockResource');res.innerHTML='<option value="">Aucune ressource</option>'+state.resources.map(x=>`<option value="${escapeHtml(resourceName(x))}">${escapeHtml(resourceName(x))}</option>`).join('');res.value=block.resourceName||'';$('blockDrawer').hidden=false;
  }
  function closeDrawer(){$('blockDrawer').hidden=true;state.selected=null}
  $('closeDrawer').onclick=closeDrawer;$('blockDrawer').onclick=e=>{if(e.target===$('blockDrawer'))closeDrawer()};
  $('saveBlock').onclick=()=>{const selected=state.selected;if(!selected)return;const b=selected.block;b.type=$('editBlockType').value;b.title=$('editBlockTitle').value.trim()||BLOCK_TYPES[b.type].label;b.objective=$('editBlockObjective').value.trim();b.durationMinutes=Math.max(1,Number($('editBlockDuration').value)||1);b.content=$('editBlockContent').value.trim();b.resourceName=$('editBlockResource').value;b.teacherNote=$('editTeacherNote').value.trim();b.validated=true;closeDrawer();renderPlan();toast('Bloc modifié et validé.')};
  $('deleteBlock').onclick=()=>{if(!state.selected||!confirm('Supprimer ce bloc du cours ?'))return;state.selected.session.blocks=state.selected.session.blocks.filter(b=>b!==state.selected.block);closeDrawer();renderPlan();toast('Bloc supprimé.')};

  function renderPublish(){
    if(!state.plan)return;const s=planStats(),hours=Math.round(state.plan.totalDurationMinutes/6)/10,target=state.plan.targetContext?`${state.plan.targetContext.subjectName} · ${state.plan.targetContext.gradeLevelName}`:'';$('publishTitle').textContent=state.plan.courseTitle;$('publishMeta').textContent=`${target?target+' · ':''}${state.plan.sessions.length} séance${state.plan.sessions.length>1?'s':''} · ${hours} h · ${s.blocks.length} blocs`;
    $('publishStats').innerHTML=`<div class="publish-stat"><strong>${hours} h</strong><span>Durée totale</span></div><div class="publish-stat"><strong>${s.blocks.length}</strong><span>Blocs pédagogiques</span></div><div class="publish-stat"><strong>${state.resources.length}</strong><span>Ressources associées</span></div>`;
  }
  $('publishConfirm').onchange=()=>{$('publishBtn').disabled=!$('publishConfirm').checked};
  function safeFileName(name){return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100)||'fichier'}
  async function uploadSource(sb,teacherId,courseId,file,folder){const path=`${teacherId}/courses/${courseId}/${folder}/${Date.now()}-${safeFileName(file.name)}`;const {error}=await sb.storage.from('course-media').upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});if(error)throw error;return path}
  function courseBlockRows(courseId,importId,sourceMap){
    const rows=[];
    state.plan.sessions.forEach((session,si)=>session.blocks.forEach((b,bi)=>rows.push({course_id:courseId,import_id:importId,session_position:si,position:bi,block_type:b.type,title:b.title,duration_minutes:b.durationMinutes,objective:b.objective,content:{text:b.content,session_title:session.title,session_duration_minutes:session.durationMinutes,explanation_minutes:session.explanationMinutes,presentation:b.presentation||null,activity:b.activity||null,simulation:b.simulation||null,image:b.image||null,evaluation:b.evaluation||null},source_id:sourceMap[b.resourceName]||null,status:b.validated?'validated':'draft',teacher_notes:b.teacherNote||''})));
    return rows;
  }
  async function saveExistingCourse(sb,publish){
    const sourceMap={};
    for(const resource of state.resources){
      if(!resource.dbId&&resource.file){
        const storagePath=await uploadSource(sb,window.currentTeacher.session.user.id,state.courseId,resource.file,'resources');
        const {data:source,error}=await sb.from('course_sources').insert({course_id:state.courseId,import_id:state.importId,kind:resource.kind,file_name:resource.file.name,mime_type:resource.file.type||'application/octet-stream',storage_path:storagePath,pedagogical_objective:resource.objective,ai_metadata:{size:resource.file.size}}).select('id').single();
        if(error)throw error;resource.dbId=source.id;resource.storagePath=storagePath;
      }
      if(resource.dbId)sourceMap[resourceName(resource)]=resource.dbId;
    }
    const backup=state.persistedBlocks.map(row=>({id:row.id,course_id:state.courseId,import_id:state.importId,session_position:row.session_position,position:row.position,block_type:row.block_type,title:row.title,duration_minutes:row.duration_minutes,objective:row.objective,content:row.content||{},source_id:row.source_id||null,status:row.status,teacher_notes:row.teacher_notes||''}));
    const {error:courseError}=await sb.from('courses').update({title:state.plan.courseTitle,description:state.plan.summary,status:'draft',settings:{source:'teacher_pdf_ai',duration_minutes:state.plan.totalDurationMinutes,explanation_minutes_per_hour:'15-20',target_context:state.plan.targetContext||null,source_assessment:state.plan.sourceAssessment||null}}).eq('id',state.courseId);if(courseError)throw courseError;
    const {error:importError}=await sb.from('course_imports').update({status:'ready',duration_minutes:state.plan.totalDurationMinutes,analysis:state.plan,error_message:null}).eq('id',state.importId);if(importError)throw importError;
    const {error:deleteError}=await sb.from('course_blocks').delete().eq('course_id',state.courseId);if(deleteError)throw deleteError;
    const rows=courseBlockRows(state.courseId,state.importId,sourceMap);if(rows.length){const {error}=await sb.from('course_blocks').insert(rows);if(error){if(backup.length)await sb.from('course_blocks').insert(backup);throw error}}
    if(state.removedSources.length){const ids=state.removedSources.map(x=>x.id),paths=state.removedSources.map(x=>x.storagePath).filter(Boolean);const {error}=await sb.from('course_sources').delete().in('id',ids);if(error)throw error;if(paths.length)await sb.storage.from('course-media').remove(paths);state.removedSources=[]}
    if(publish){const {error}=await sb.from('courses').update({status:'published'}).eq('id',state.courseId);if(error)throw error}
  }
  function courseBoardsUrl(courseId){return `prof.html?course=${encodeURIComponent(courseId)}&boards=1`}
  /* ===== VOIX DU COURS GÉNÉRÉES UNE SEULE FOIS, À LA CRÉATION =====
     Après l'enregistrement, on reconstruit les étapes exactement comme le lecteur
     (loadPublishedCourseLesson), on synthétise chaque texte parlé UNE fois, et on range
     les fichiers audio dans le storage du cours avec une carte {empreinte -> chemin}
     (settings.audio_map). Le lecteur rejoue ces fichiers sans jamais re-synthétiser ;
     seules les questions libres et les réexplications génèrent de nouvelles voix.
     Un échec (voix serveur indisponible…) n'empêche jamais l'enregistrement du cours. */
  async function pregenerateCourseAudio(sb,courseId){
    if(!window.loadPublishedCourseLesson||!window.ccTextHash)return;
    let lesson;try{lesson=await window.loadPublishedCourseLesson(courseId);}catch(error){console.warn('Voix du cours : lecture impossible,',error.message);return}
    const texts=[...new Set(lesson.etapes.map(e=>String(e.say||'').trim()).filter(Boolean))];
    if(!texts.length)return;
    const {data:course,error:courseError}=await sb.from('courses').select('settings').eq('id',courseId).single();
    if(courseError)return;
    const settings=course&&course.settings&&typeof course.settings==='object'?course.settings:{};
    const map=settings.audio_map&&typeof settings.audio_map==='object'?settings.audio_map:{};
    const teacherId=window.currentTeacher.session.user.id;
    let generated=0,failures=0;
    for(let index=0;index<texts.length;index++){
      const text=texts[index],hash=window.ccTextHash(text);
      if(map[hash])continue;                       // déjà enregistré lors d'une création précédente
      if(failures>=3)break;                        // voix serveur KO : le lecteur synthétisera à la volée
      $('loadingMessage').textContent=`Enregistrement de la voix du cours (${index+1}/${texts.length})…`;
      try{
        const response=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,targetContext:lesson.targetContext||null})});
        if(!response.ok||response.status===204){failures++;continue}
        const blob=await response.blob();if(!blob.size){failures++;continue}
        const wav=(response.headers.get('content-type')||'').includes('wav');
        const storagePath=`${teacherId}/courses/${courseId}/audio/${hash}.${wav?'wav':'mp3'}`;
        const {error}=await sb.storage.from('course-media').upload(storagePath,blob,{contentType:blob.type||(wav?'audio/wav':'audio/mpeg'),upsert:true});
        if(error){failures++;continue}
        map[hash]=storagePath;generated++;
      }catch(error){failures++}
    }
    if(generated){
      const {error}=await sb.from('courses').update({settings:Object.assign({},settings,{audio_map:map})}).eq('id',courseId);
      if(!error)toast(`${generated} voix du cours enregistrée${generated>1?'s':''} — elles ne seront plus régénérées.`);
    }
  }
  async function saveCourse(publish,options){
    options=options||{};
    if(state.saving)return;const sb=window.classesSupabase,teacher=window.currentTeacher,assignment=state.assignments.find(x=>x.id===$('assignment').value);if(!sb||!teacher||(!state.courseId&&!assignment))return toast('Session professeur indisponible.',true);
    if(publish&&allBlocks().some(block=>!block.validated)){setStage(2);return toast('Validez tous les blocs avant de publier.',true)}
    state.saving=true;$('saveDraftBtn').disabled=true;$('publishBtn').disabled=true;startLoading();$('loadingMessage').textContent='Enregistrement du cours et des ressources';
    let courseId='';
    try{
      if(state.courseId){await saveExistingCourse(sb,publish);await pregenerateCourseAudio(sb,state.courseId);stopLoading();toast(publish?'Cours publié avec succès.':'Modifications enregistrées.');const target=options.openBoards?courseBoardsUrl(state.courseId):(publish?`index.html?course=${encodeURIComponent(state.courseId)}`:'prof.html?view=private');return setTimeout(()=>location.href=target,500)}
      const {data:course,error:courseError}=await sb.from('courses').insert({teacher_id:teacher.session.user.id,assignment_id:assignment.id,subject_id:assignment.subject_id,grade_level_id:assignment.grade_level_id,stream_id:assignment.stream_id||null,title:state.plan.courseTitle,description:state.plan.summary,status:'draft',settings:{source:'teacher_pdf_ai',duration_minutes:state.plan.totalDurationMinutes,explanation_minutes_per_hour:'15-20',target_context:state.plan.targetContext||null,source_assessment:state.plan.sourceAssessment||null}}).select('id').single();if(courseError)throw courseError;courseId=course.id;
      const pdfPath=await uploadSource(sb,teacher.session.user.id,courseId,state.pdf,'sources');
      const {data:job,error:jobError}=await sb.from('course_imports').insert({course_id:courseId,status:'ready',source_pdf_path:pdfPath,duration_minutes:state.plan.totalDurationMinutes,analysis:state.plan}).select('id').single();if(jobError)throw new Error('Migration 007 requise : '+jobError.message);
      const sourceMap={};
      for(const r of state.resources){const storagePath=await uploadSource(sb,teacher.session.user.id,courseId,r.file,'resources');const {data:source,error}=await sb.from('course_sources').insert({course_id:courseId,import_id:job.id,kind:r.kind,file_name:r.file.name,mime_type:r.file.type||'application/octet-stream',storage_path:storagePath,pedagogical_objective:r.objective,ai_metadata:{size:r.file.size}}).select('id').single();if(error)throw error;sourceMap[r.file.name]=source.id}
      const rows=courseBlockRows(courseId,job.id,sourceMap);
      if(rows.length){const {error}=await sb.from('course_blocks').insert(rows);if(error)throw error}
      if(publish){const {error}=await sb.from('courses').update({status:'published'}).eq('id',courseId);if(error)throw error}
      state.courseId=courseId;await pregenerateCourseAudio(sb,courseId);stopLoading();toast(options.openBoards?'Tableaux du cours prêts.':(publish?'Cours publié avec succès.':'Brouillon enregistré.'));const target=options.openBoards?courseBoardsUrl(courseId):(publish?`index.html?course=${encodeURIComponent(courseId)}`:'prof.html?view=private');setTimeout(()=>location.href=target,500);
    }catch(error){stopLoading();if(courseId)await sb.from('courses').delete().eq('id',courseId);toast(error.message||'Enregistrement impossible.',true);state.saving=false;$('saveDraftBtn').disabled=false;$('publishBtn').disabled=!$('publishConfirm').checked}
  }
  $('saveDraftBtn').onclick=()=>saveCourse(false);$('publishBtn').onclick=()=>saveCourse(true);

  async function loadExistingCourse(sb,courseId){
    if(!/^[0-9a-f-]{36}$/i.test(courseId))throw new Error('Identifiant de cours invalide.');
    const [{data:course,error:courseError},{data:imports,error:importError},{data:sources,error:sourceError},{data:blocks,error:blockError}]=await Promise.all([
      sb.from('courses').select('id,title,description,status,assignment_id,settings').eq('id',courseId).eq('teacher_id',window.currentTeacher.session.user.id).single(),
      sb.from('course_imports').select('id,duration_minutes,analysis,created_at').eq('course_id',courseId).order('created_at',{ascending:false}).limit(1),
      sb.from('course_sources').select('id,kind,file_name,mime_type,storage_path,pedagogical_objective,ai_metadata').eq('course_id',courseId).order('created_at',{ascending:true}),
      sb.from('course_blocks').select('id,session_position,position,block_type,title,duration_minutes,objective,content,source_id,status,teacher_notes').eq('course_id',courseId).order('session_position',{ascending:true}).order('position',{ascending:true})
    ]);
    if(courseError)throw courseError;if(importError)throw importError;if(sourceError)throw sourceError;if(blockError)throw blockError;
    const job=imports&&imports[0];if(!job)throw new Error('Ce cours ne possède pas encore de structure IA.');
    state.courseId=course.id;state.importId=job.id;state.persistedBlocks=blocks||[];
    state.resources=(sources||[]).map(source=>({id:source.id,dbId:source.id,name:source.file_name,size:Number(source.ai_metadata&&source.ai_metadata.size||0),kind:source.kind,mimeType:source.mime_type,storagePath:source.storage_path,objective:source.pedagogical_objective||defaultObjective(source.kind)}));
    $('durationHours').value=Math.max(1,Number(job.duration_minutes||120)/60);$('courseTitle').value=course.title||'';$('assignment').value=course.assignment_id||'';
    const sourceNames={};state.resources.forEach(resource=>sourceNames[resource.dbId]=resourceName(resource));
    const plan=normalizePlan(Object.assign({},job.analysis||{},{courseTitle:course.title,summary:course.description,totalDurationMinutes:Number(job.duration_minutes)||120}));
    if(blocks&&blocks.length){
      const grouped={};blocks.forEach(row=>(grouped[row.session_position]||(grouped[row.session_position]=[])).push(row));
      plan.sessions=Object.keys(grouped).map(Number).sort((a,b)=>a-b).map((sessionIndex,newIndex)=>{
        const template=(plan.sessions&&plan.sessions[sessionIndex])||{};const rows=grouped[sessionIndex];const content=rows[0]&&rows[0].content||{};
        return {id:template.id||'session-'+(newIndex+1),title:content.session_title||template.title||`Séance ${newIndex+1}`,durationMinutes:Number(content.session_duration_minutes)||Number(template.durationMinutes)||rows.reduce((n,row)=>n+Number(row.duration_minutes||0),0),explanationMinutes:Number(content.explanation_minutes)||Number(template.explanationMinutes)||0,objective:template.objective||'',blocks:rows.map(row=>({id:row.id,dbId:row.id,type:row.block_type,title:row.title,durationMinutes:Number(row.duration_minutes)||5,objective:row.objective||'',content:row.content&&row.content.text||'',presentation:row.content&&row.content.presentation||null,activity:row.content&&row.content.activity||null,simulation:row.content&&row.content.simulation||null,image:row.content&&row.content.image||null,evaluation:row.content&&row.content.evaluation||null,resourceName:sourceNames[row.source_id]||'',teacherNote:row.teacher_notes||'',validated:row.status==='validated'}))};
      });
    }
    state.plan=plan;enablePlanStages();document.querySelector('[data-go-stage="1"]').disabled=true;$('backToSources').textContent='← Mes cours';$('studioTools').hidden=false;$('avatarPreviewLink').href='index.html?course='+encodeURIComponent(course.id);$('avatarPreviewLink').textContent='▶ Expliquer tout le cours avec l’avatar';renderResources();renderPlan();setStage(2);
    if(course.status==='published')toast('Cours publié chargé. Toute modification sera enregistrée en brouillon.');
  }

  async function init(){
    try{
      const teacher=await window.teacherAuthReady,sb=window.classesSupabase;if(!teacher||!sb)return;
      const {data,error}=await sb.from('teacher_assignments').select('id,subject_id,grade_level_id,stream_id,subjects(code,name),grade_levels(code,name),study_streams(code,name)').eq('status','active');if(error)throw error;state.assignments=data||[];
      const select=$('assignment');select.innerHTML='';state.assignments.forEach(a=>{const option=document.createElement('option');option.value=a.id;option.textContent=`${a.subjects&&a.subjects.name||'Matière'} — ${a.grade_levels&&a.grade_levels.name||'Niveau'}${a.study_streams&&a.study_streams.name&&a.study_streams.name!=='Sans filière'?' · '+a.study_streams.name:''}`;select.appendChild(option)});if(!state.assignments.length){select.innerHTML='<option value="">Aucune matière attribuée</option>';select.disabled=true}select.onchange=updateSourceSummary;updateSourceSummary();
      const courseId=new URLSearchParams(location.search).get('course');if(courseId){location.replace(courseBoardsUrl(courseId));return}
    }catch(error){toast('Impossible de charger votre attribution : '+(error.message||error),true)}
  }
  init();
})();
