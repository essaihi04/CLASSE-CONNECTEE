(function(){
  'use strict';
  const PHASE_BY_TYPE={
    text:'concept',image:'concept',video:'hypothese',schema:'structuration',simulation:'concept',
    activity:'structuration',question:'probleme',summary:'bilan',evaluation:'bilan'
  };
  const MEDIA_KINDS=new Set(['image','schema','video','simulation','audio','other']);
  const SCENES=new Set(['avatar_only','split_left','split_right','board_focus','media_focus','activity_focus','question_focus','summary_focus']);

  function html(value){return String(value??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}
  function attr(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function plain(value,max=8000){return String(value??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
  function chunks(text,max=1200){
    const sentences=plain(text,12000).split(/(?<=[.!?…])\s+/).filter(Boolean),out=[];let current='';
    const push=value=>{value=plain(value,max);if(value)out.push(value)};
    sentences.forEach(sentence=>{
      if(sentence.length>max){if(current){push(current);current=''}for(let start=0;start<sentence.length;start+=max)push(sentence.slice(start,start+max));return}
      if(current&&current.length+sentence.length+1>max){push(current);current=sentence}else current+=(current?' ':'')+sentence;
    });
    if(current)push(current);return out.length?out:['Contenu à compléter par le professeur.'];
  }
  function boardLines(text,limit=5){
    const sentences=plain(text,2200).split(/(?<=[.!?…])\s+/).filter(Boolean),lines=[];
    sentences.forEach(sentence=>{
      const words=sentence.split(/\s+/),parts=[];let current='';
      words.forEach(word=>{if(current&&current.length+word.length+1>150){parts.push(current);current=word}else current+=(current?' ':'')+word});
      if(current)parts.push(current);parts.forEach(part=>lines.push(part));
    });
    return lines.slice(0,limit).map((line,index)=>({t:html(line),cls:index===0?'def':''}));
  }
  function compact(value,max=100){
    const text=plain(value,max+40);if(text.length<=max)return text;
    const cut=text.slice(0,max).replace(/\s+\S*$/,'');return (cut||text.slice(0,max))+'…';
  }
  function client(){
    const config=window.CLASSES_SUPABASE||{};
    if(!window.supabase||!/^https:\/\//.test(config.url||'')||!config.anonKey)throw new Error('Configuration Supabase indisponible.');
    if(!window.classesSupabase)window.classesSupabase=window.supabase.createClient(config.url,config.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return window.classesSupabase;
  }
  async function signedSources(sb,sources){
    const entries=await Promise.all((sources||[]).map(async source=>{
      const {data,error}=await sb.storage.from('course-media').createSignedUrl(source.storage_path,3600);
      return [source.id,Object.assign({},source,{url:error?'':data&&data.signedUrl||''})];
    }));
    return Object.fromEntries(entries);
  }

  // Compositions standardisées. Les pourcentages sont relatifs au tableau et restent identiques
  // en vue normale comme en plein écran. Le professeur peut toujours les remplacer dans l'éditeur.
  function layoutForScene(scene,avatarSize,mediaPosition){
    const full=avatarSize!=='reduced';
    const mediaLayouts={
      left:{avatar:{x:83,y:72,w:12,h:12,mode:'head',z:7},el:{title:{x:59,y:6,w:36,h:12,fs:28,z:3},media:{x:4,y:15,w:52,h:72,z:3},body:{x:60,y:23,w:34,h:44,fs:19,z:4}}},
      right:{avatar:{x:3,y:4,w:11,h:11,mode:'head',z:7},el:{title:{x:18,y:6,w:76,h:12,fs:28,z:3},body:{x:5,y:23,w:29,h:60,fs:19,z:4},media:{x:38,y:15,w:57,h:72,z:3}}},
      wide:{avatar:{x:3,y:72,w:12,h:12,mode:'head',z:7},el:{title:{x:4,y:5,w:91,h:11,fs:28,z:3},body:{x:4,y:20,w:25,h:46,fs:18,z:4},media:{x:32,y:17,w:64,h:70,z:3}}}
    };
    const layouts={
      split_left:{avatar:{x:1,y:7,w:full?27:14,h:full?88:14,mode:full?'full':'head',z:5},el:{title:{x:31,y:8,w:64,h:12,fs:31,z:3},body:{x:31,y:23,w:63,h:66,fs:22,z:3}}},
      split_right:{avatar:{x:72,y:7,w:full?27:14,h:full?88:14,mode:full?'full':'head',z:5},el:{title:{x:5,y:8,w:64,h:12,fs:31,z:3},body:{x:5,y:23,w:63,h:66,fs:22,z:3}}},
      board_focus:{avatar:{x:83,y:4,w:13,h:13,mode:'head',z:6},el:{title:{x:5,y:7,w:74,h:12,fs:32,z:3},body:{x:5,y:23,w:74,h:66,fs:23,z:3}}},
      media_focus:mediaLayouts[mediaPosition]||mediaLayouts.right,
      activity_focus:{avatar:{x:1,y:23,w:18,h:65,mode:'full',z:6},el:{title:{x:21,y:5,w:73,h:12,fs:30,z:3},body:{x:21,y:82,w:72,h:10,fs:17,z:3},sim:{x:21,y:19,w:72,h:60,fs:17,z:4}}},
      question_focus:{avatar:{x:67,y:13,w:26,h:80,mode:'full',z:5},el:{title:{x:5,y:7,w:58,h:12,fs:29,z:3},probleme:{x:5,y:23,w:56,h:50,fs:25,z:3},body:{x:5,y:76,w:56,h:12,fs:18,z:3}}},
      summary_focus:{avatar:{x:1,y:12,w:24,h:80,mode:'full',z:5},el:{title:{x:28,y:7,w:66,h:12,fs:31,z:3},body:{x:28,y:23,w:65,h:65,fs:22,z:3}}}
    };
    return layouts[scene]||layouts.board_focus;
  }
  function inferredScene(type,source,visualIndex){
    if(source&&MEDIA_KINDS.has(source.kind))return 'media_focus';
    if(type==='activity'||type==='simulation')return 'activity_focus';
    if(type==='question'||type==='evaluation')return 'question_focus';
    if(type==='summary')return 'summary_focus';
    return visualIndex%3===0?'split_left':visualIndex%3===1?'board_focus':'split_right';
  }
  function normalizePresentation(raw,type,source,visualIndex){
    const suggested=raw&&typeof raw==='object'&&SCENES.has(raw.scene)?raw.scene:null;
    let scene=suggested||inferredScene(type,source,visualIndex);
    // L'ouverture avatar seul est déjà créée par le lecteur avant les blocs du PDF. Un bloc de
    // contenu garde donc toujours une zone lisible, même si l'IA redemande avatar_only.
    if(scene==='avatar_only')scene='split_left';
    const avatarSize=raw&&raw.avatarSize==='full'?'full':(raw&&raw.avatarSize==='reduced'?'reduced':(/^(question|summary)$/.test(type)?'full':'reduced'));
    const requestedPosition=raw&&['left','right','wide'].includes(raw.mediaPosition)?raw.mediaPosition:'';
    const needsWide=!!(source&&['video','simulation'].includes(source.kind));
    const mediaPosition=needsWide?'wide':(requestedPosition||(visualIndex%2?'left':'right'));
    return {scene,avatarSize,mediaPosition,layout:scene==='avatar_only'?null:layoutForScene(scene,avatarSize,mediaPosition)};
  }
  function mediaType(source){
    if(!source)return 'link';
    if(source.kind==='video')return 'video';
    if(source.kind==='audio')return 'audio';
    if(source.kind==='image'||source.kind==='schema')return 'image';
    if(source.kind==='simulation'&&(/html/i.test(source.mime_type||'')||/\.html?(?:$|[?#])/i.test(source.file_name||'')))return 'simulation';
    return 'link';
  }
  function sourceMedia(source,title,explain){
    return {type:mediaType(source),kind:source.kind,src:source.url,desc:plain(source.file_name||title,180).replace(/["<>]/g,''),objective:plain(source.pedagogical_objective,240),explain};
  }
  function sourceForRow(row,sourceMap,allSources){
    if(row.source_id&&sourceMap[row.source_id])return sourceMap[row.source_id];
    const content=row.content&&typeof row.content==='object'?row.content:{};
    const hay=plain(`${row.title||''} ${content.text||''}`,12000).toLocaleLowerCase('fr');
    return (allSources||[]).find(source=>{
      const name=plain(source.file_name,220).toLocaleLowerCase('fr'),base=name.replace(/\.[^.]+$/,'');
      return (name&&hay.includes(name))||(base.length>=4&&hay.includes(base));
    })||null;
  }
  function standaloneResourceStep(source,mediaIndex){
    const objective=plain(source.pedagogical_objective,240)||'Observer et exploiter cette ressource pédagogique.';
    const presentation=normalizePresentation({scene:'media_focus',avatarSize:'reduced'},source.kind,source,mediaIndex);
    const media=sourceMedia(source,source.file_name,objective),hold=['video','simulation','audio','link'].includes(media.type);
    return {phase:'concept',say:`Regardons maintenant le support ${plain(source.file_name,180)}. ${objective}`,pauseForAnswer:hold,
      board:{title:html(source.file_name||'Support pédagogique'),lines:boardLines(objective,2),media},presentation};
  }
  function activityBoard(activity,fallbackRows){
    let kind=activity&&activity.kind,instruction=plain(activity&&activity.instruction,300);
    let items=(activity&&Array.isArray(activity.items)?activity.items:[]).map(item=>({
      prompt:plain(item&&item.prompt,180),answer:plain(item&&item.answer,180),
      options:(Array.isArray(item&&item.options)?item.options:[]).map(x=>plain(x,180)).filter(Boolean).slice(0,6)
    })).filter(item=>item.prompt&&item.answer).slice(0,6);
    if(items.length<2){
      kind='tableau';
      items=(fallbackRows||[]).filter(row=>row.title&&row.clue).slice(-4).map(row=>({prompt:compact(row.title,70),answer:compact(row.clue,105),options:[]}));
    }
    if(items.length<2)return null;
    if(kind==='tableau'){
      const allAnswers=[...new Set(items.map(item=>item.answer))];
      return {fillTable:{headers:['Indice du cours','À compléter'],rows:items.map(item=>({cells:[html(item.prompt),null],answer:item.answer,options:[...new Set((item.options.length?item.options:allAnswers).concat(item.answer))]})),conclusion:'Les notions essentielles de cette partie sont maintenant organisées.'}};
    }
    return {match:{consigne:instruction||'Associe chaque notion à sa description issue du cours.',pairs:items.map(item=>({a:item.prompt,b:item.answer}))}};
  }
  function evaluationQuestion(raw,fallback){
    raw=raw&&typeof raw==='object'?raw:{};const kind=['qcm','vf','libre','association'].includes(raw.kind)?raw.kind:'libre';
    const q=html(plain(raw.question||fallback,500)),enonce=html(plain(raw.enonce,500)),fb=html(plain(raw.feedback,500));
    if(kind==='qcm'){
      const options=(Array.isArray(raw.options)?raw.options:[]).map(x=>html(plain(x,180))).filter(Boolean).slice(0,6);
      if(options.length>=2)return {type:'qcm',enonce,q,options,correct:Math.max(0,Math.min(options.length-1,Number(raw.correctIndex)||0)),fb};
    }
    if(kind==='vf')return {type:'vf',enonce,q,correct:raw.correctBoolean===true,fb};
    if(kind==='association'){
      const pairs=(Array.isArray(raw.pairs)?raw.pairs:[]).map(pair=>({l:html(plain(pair&&pair.left,160)),r:html(plain(pair&&pair.right,160))})).filter(pair=>pair.l&&pair.r).slice(0,6);
      if(pairs.length>=2)return {type:'association',enonce,q,pairs,fb};
    }
    const attendus=(Array.isArray(raw.expectedKeywords)?raw.expectedKeywords:[]).map(x=>plain(x,100)).filter(Boolean).slice(0,10);
    return {type:'libre',enonce,q,attendus:attendus.length?attendus:[plain(raw.expectedAnswer,120)||'réponse attendue'],reponse:html(plain(raw.expectedAnswer,400)),fb};
  }
  function stepFromBlock(row,source,chunk,chunkIndex,chunkCount,sessionTitle,visualIndex,mediaIndex,sessionRows){
    const type=row.block_type||'text',content=row.content&&typeof row.content==='object'?row.content:{};
    const title=plain(row.title||'Partie du cours',180),objective=plain(row.objective,300);
    const shownTitle=chunkCount>1?`${title} (${chunkIndex+1}/${chunkCount})`:title;
    const presentation=normalizePresentation(content.presentation,type,source,source?mediaIndex:visualIndex);
    const board={title:html(shownTitle),lines:boardLines(chunk,presentation.scene==='media_focus'?2:5)};
    if(type==='question'||type==='evaluation'){board.probleme=html(chunk);board.lines=[];}
    if(source&&source.url){
      board.media=sourceMedia(source,title,chunk);if(!board.media.objective)board.media.objective=objective;
    }
    if(type==='activity'||(type==='simulation'&&!board.media)){
      const interactive=activityBoard(content.activity,sessionRows);if(interactive)Object.assign(board,interactive);
    }
    if(presentation.scene==='board_focus'&&chunkIndex===0)board.linesAfterSpeech=true;
    const lead=type==='image'?'Observe attentivement cette image. ':type==='schema'?'Regardons comment ce schéma est organisé. ':type==='video'?'Observe cette vidéo avant de retenir l’explication. ':type==='simulation'?'Manipule la simulation et observe le résultat. ':type==='activity'?'À toi de participer au tableau. ':type==='question'||type==='evaluation'?'Je te laisse quelques instants pour répondre. ':type==='summary'?'Retenons l’essentiel. ':'';
    const holdForResource=!!(board.media&&['video','simulation','audio','link'].includes(board.media.type));
    return {phase:PHASE_BY_TYPE[type]||'concept',say:`${sessionTitle?sessionTitle+'. ':''}${shownTitle}. ${lead}${chunk}${objective?' Objectif : '+objective:''}`.slice(0,1950),board,presentation,pauseForAnswer:type==='question'||type==='evaluation'||holdForResource};
  }
  function checkpointStep(row,index){
    const subject=plain(row&&row.title||'la notion précédente',140);
    const question=`Explique avec tes propres mots ce que tu as compris de « ${subject} ».`;
    return {phase:'probleme',say:`Petite pause. ${question} Prends le temps de réfléchir, puis poursuis quand tu es prêt.`,pauseForAnswer:true,
      board:{title:'À toi de réfléchir',probleme:html(question),lines:[]},
      presentation:{scene:'question_focus',avatarSize:'full',layout:layoutForScene('question_focus','full')},__checkpoint:index};
  }
  async function loadPublishedCourseLesson(courseId){
    if(!/^[0-9a-f-]{36}$/i.test(courseId||''))throw new Error('Identifiant de cours invalide.');
    const sb=client(),{data:{session}}=await sb.auth.getSession();
    const [{data:course,error:courseError},{data:imports,error:importError},{data:blocks,error:blockError},{data:sources,error:sourceError}]=await Promise.all([
      sb.from('courses').select('id,teacher_id,title,description,status,settings,subjects(name),grade_levels(name),study_streams(name)').eq('id',courseId).single(),
      sb.from('course_imports').select('analysis,duration_minutes,created_at').eq('course_id',courseId).order('created_at',{ascending:false}).limit(1),
      sb.from('course_blocks').select('id,session_position,position,block_type,title,duration_minutes,objective,content,source_id,status').eq('course_id',courseId).order('session_position',{ascending:true}).order('position',{ascending:true}),
      sb.from('course_sources').select('id,kind,file_name,mime_type,storage_path,pedagogical_objective').eq('course_id',courseId)
    ]);
    if(courseError)throw courseError;if(importError)throw importError;if(blockError)throw blockError;if(sourceError)throw sourceError;
    const owner=!!(session&&session.user&&session.user.id===course.teacher_id);
    let admin=false;
    if(session&&session.user&&!owner){
      const {data:profile}=await sb.from('profiles').select('role').eq('id',session.user.id).maybeSingle();
      admin=!!(profile&&profile.role==='admin');
    }
    if(course.status!=='published'&&!owner&&!admin)throw new Error('Ce cours n’est pas publié.');
    if(session&&session.user&&!owner&&!admin)throw new Error('Ce cours appartient à un autre professeur.');
    const sourceMap=await signedSources(sb,sources||[]),allSources=Object.values(sourceMap),usedSourceIds=new Set(),analysis=imports&&imports[0]&&imports[0].analysis||{};
    const sessionNames={};(analysis.sessions||[]).forEach((item,index)=>sessionNames[index]=plain(item&&item.title,180));
    const etapes=[{intro:true,say:`Bienvenue dans le cours ${plain(course.title,180)}. ${plain(course.description||analysis.summary,1200)} Aujourd'hui, je vais te guider avec des explications, des ressources à observer et des moments où tu participeras au tableau.`,board:{title:'',lines:[]},presentation:{scene:'avatar_only',avatarSize:'full'}}];
    const grouped={};(blocks||[]).forEach(row=>(grouped[row.session_position]||(grouped[row.session_position]=[])).push(row));
    const quizSets=[];
    let visualIndex=0,mediaIndex=0,explanationsSinceQuestion=0,checkpointIndex=0,processedRows=0,midpointDone=false;
    const midpointAt=Math.ceil((blocks||[]).length/2);
    Object.keys(grouped).map(Number).sort((a,b)=>a-b).forEach(sessionPosition=>{
      const rows=grouped[sessionPosition],sessionTitle=plain((rows[0]&&rows[0].content&&rows[0].content.session_title)||sessionNames[sessionPosition]||`Séance ${sessionPosition+1}`,180);
      const sessionRows=rows.filter(row=>!['question','evaluation','activity','simulation'].includes(row.block_type)).map(row=>({title:plain(row.title,100),clue:plain(row.objective||(row.content&&row.content.text),180)}));
      rows.forEach(row=>{
        const content=row.content&&typeof row.content==='object'?row.content:{};
        const text=plain(content.text||row.objective||row.title,12000),parts=chunks(text);
        const source=sourceForRow(row,sourceMap,allSources);if(source)usedSourceIds.add(source.id);
        parts.forEach((part,index)=>{etapes.push(stepFromBlock(row,source,part,index,parts.length,sessionTitle,visualIndex++,source?mediaIndex++:mediaIndex,sessionRows));});
        if(['question','evaluation'].includes(row.block_type))explanationsSinceQuestion=0;
        else if(!['activity','simulation'].includes(row.block_type))explanationsSinceQuestion++;
        if(explanationsSinceQuestion>=4){etapes.push(checkpointStep(row,++checkpointIndex));explanationsSinceQuestion=0;visualIndex++;}
        processedRows++;
        if(!midpointDone&&(blocks||[]).length>=5&&processedRows>=midpointAt){
          midpointDone=true;
          etapes.push({intro:true,phase:'rappel',say:'Nous sommes au milieu du parcours. Nous avons posé les premières bases. Fais une courte pause, puis nous allons relier ces idées et passer à la suite.',board:{title:'',lines:[]},presentation:{scene:'avatar_only',avatarSize:'full'}});
        }
      });
      const sessionQuiz=rows.filter(row=>row.block_type==='evaluation').map(row=>evaluationQuestion(row.content&&row.content.evaluation,(row.content&&row.content.text)||row.title)).filter(Boolean);
      if(sessionQuiz.length)quizSets.push({label:`Évaluation · ${sessionTitle}`,intro:`Vérifie les objectifs de ${sessionTitle}.`,quiz:sessionQuiz});
      const hasInteractive=rows.some(row=>['activity','simulation'].includes(row.block_type));
      if(!hasInteractive&&sessionRows.length>=2){
        const board=activityBoard(null,sessionRows);if(board)etapes.push({phase:'structuration',say:`Passons au tableau pour organiser les notions de ${sessionTitle}. Associe chaque notion à la description correspondante.`,board:Object.assign({title:'Activité au tableau',lines:[]},board),presentation:{scene:'activity_focus',avatarSize:'full',layout:layoutForScene('activity_focus','full')}});
      }
    });
    const unusedSources=allSources.filter(source=>source.url&&!usedSourceIds.has(source.id));
    unusedSources.forEach(source=>etapes.push(standaloneResourceStep(source,mediaIndex++)));
    if(etapes.length===1)throw new Error('Ce cours ne contient aucun bloc publié.');
    const target=analysis.targetContext||(course.settings&&course.settings.target_context)||{subjectName:course.subjects&&course.subjects.name,gradeLevelName:course.grade_levels&&course.grade_levels.name,streamName:course.study_streams&&course.study_streams.name};
    const targetLabel=[plain(target.subjectName,160),plain(target.gradeLevelName,160),plain(target.streamName,120)].filter(value=>value&&value!=='Sans filière').join(' · ');
    const targetContext=targetLabel?`CIBLE EXACTE DU COURS : ${targetLabel}. Répondre uniquement pour cette matière et cette année scolaire, avec le vocabulaire, les prérequis et les méthodes correspondants.\n`:'';
    const context=(targetContext+(blocks||[]).map(row=>`${plain(row.title,180)} : ${plain(row.content&&row.content.text||row.objective,800)}`).join('\n')).slice(0,6500);
    const suggestedQuestions=(blocks||[]).filter(row=>row.block_type==='question'||row.block_type==='evaluation').map(row=>plain(row.title,90)).filter(Boolean).slice(0,4);
    if(!suggestedQuestions.length)suggestedQuestions.push('Résume ce cours','Réexplique la notion principale','Quel est le point le plus important ?','Propose-moi une question de révision');
    // Voix générées progressivement pendant la lecture : au premier passage le serveur
    // synthétise et enregistre la piste, puis cette carte permet de la réutiliser.
    const audioSetting=course.settings&&course.settings.audio_map&&typeof course.settings.audio_map==='object'?course.settings.audio_map:{};
    const audioEntries=await Promise.all(Object.entries(audioSetting).slice(0,500).map(async([hash,storagePath])=>{
      if(typeof storagePath!=='string'||!storagePath)return [hash,''];
      const {data,error}=await sb.storage.from('course-media').createSignedUrl(storagePath,7200);
      return [hash,error?'':data&&data.signedUrl||''];
    }));
    const audioMap=Object.fromEntries(audioEntries.filter(([,url])=>url));
    return {id:'published-'+course.id,imported:true,publishedCourseId:course.id,courseStatus:course.status,courseAudioToken:owner&&session?session.access_token:'',sem:'PDF',titre:plain(course.title,180),description:plain(course.description||analysis.summary,1500),targetLabel,targetContext:target,aiContext:context,suggestedQuestions,quizSets,audioMap,theme:{name:'cours-importé',text:'#f8fafc',key:'#fde68a',accent:'#38bdf8'},etapes};
  }
  // Empreinte stable d'un texte parlé (djb2) : partagée entre l'enregistrement à la
  // première lecture, la carte audio du cours et le lecteur (index.html).
  window.ccTextHash=function(text){
    text=String(text||'').trim();
    let h=5381;
    for(let i=0;i<text.length;i++)h=((h<<5)+h+text.charCodeAt(i))>>>0;
    return 'h'+h.toString(36)+'-'+text.length;
  };
  window.loadPublishedCourseLesson=loadPublishedCourseLesson;
})();
