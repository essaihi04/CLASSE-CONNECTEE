(function(){
  'use strict';
  const PHASE_BY_TYPE={
    text:'concept',image:'concept',video:'hypothese',schema:'structuration',simulation:'concept',
    activity:'structuration',question:'probleme',summary:'bilan',evaluation:'bilan'
  };
  const MEDIA_KINDS=new Set(['image','schema','video','simulation','audio','other']);
  const SCENES=new Set(['avatar_only','split_left','split_right','board_focus','media_focus','activity_focus','question_focus','summary_focus']);
  // Première diapositive : avatar entier, centré, avec 7 % de marge verticale. Ces bornes
  // restent valables dans le cadre 16/9 de référence, y compris en plein écran.
  const INTRO_LAYOUT={avatar:{x:30,y:7,w:40,h:86,mode:'full',z:9},el:{}};

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
  function studentQuestionReturnStep(index){return Math.max(0,Math.floor(Number(index)||0)-1)}
  function simulationStateCompleted(data,elements,zones){
    data=data&&typeof data==='object'?data:{};elements=Array.isArray(elements)?elements:[];zones=Array.isArray(zones)?zones:[];
    if(data.completed===true)return true;if(data.mode!=='drag_drop')return false;
    const expected=elements.filter(element=>zones.some(zone=>Array.isArray(zone.accepts)&&zone.accepts.includes(element.id)));
    return expected.length>0&&expected.every(element=>{const zoneId=data.state&&data.state[element.id]&&String(data.state[element.id].zoneId||'');return !!zoneId&&zones.some(zone=>zone.id===zoneId&&zone.accepts.includes(element.id))});
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
      wide:{avatar:{x:3,y:72,w:12,h:12,mode:'head',z:7},el:{title:{x:4,y:5,w:91,h:11,fs:28,z:3},body:{x:4,y:20,w:25,h:46,fs:18,z:4},media:{x:32,y:17,w:64,h:70,z:3}}},
      // Simulation : PAS de bloc de texte — la simulation remplit
      // le cadre, avec l'avatar ENTIER à côté : il énonce la consigne, félicite, corrige et
      // peut jouer à la place de l'élève via le contrat cc-sim.
      sim:{avatar:{x:0,y:20,w:33,h:72,mode:'full',z:9},el:{media:{x:27,y:3,w:70,h:94,z:3}}}
    };
    const layouts={
      split_left:{avatar:{x:0,y:7,w:full?40:14,h:full?88:14,mode:full?'full':'head',z:full?9:6},el:{title:{x:full?36:31,y:8,w:full?59:64,h:12,fs:31,z:3},body:{x:full?36:31,y:23,w:full?59:63,h:66,fs:22,z:3}}},
      split_right:{avatar:{x:full?60:72,y:7,w:full?40:14,h:full?88:14,mode:full?'full':'head',z:full?9:6},el:{title:{x:5,y:8,w:full?58:64,h:12,fs:31,z:3},body:{x:5,y:23,w:full?58:63,h:66,fs:22,z:3}}},
      board_focus:{avatar:{x:83,y:4,w:13,h:13,mode:'head',z:6},el:{title:{x:5,y:7,w:74,h:12,fs:32,z:3},body:{x:5,y:23,w:74,h:66,fs:23,z:3}}},
      media_focus:mediaLayouts[mediaPosition]||mediaLayouts.right,
      activity_focus:{avatar:{x:0,y:23,w:30,h:65,mode:'full',z:9},el:{title:{x:26,y:5,w:68,h:12,fs:30,z:3},body:{x:26,y:82,w:67,h:10,fs:17,z:3},sim:{x:26,y:19,w:67,h:60,fs:17,z:4},media:{x:26,y:19,w:67,h:60,fs:17,z:4}}},
      question_focus:{avatar:{x:64,y:13,w:36,h:80,mode:'full',z:9},el:{title:{x:5,y:7,w:58,h:12,fs:29,z:3},probleme:{x:5,y:23,w:56,h:50,fs:25,z:3},body:{x:5,y:76,w:56,h:12,fs:18,z:3}}},
      summary_focus:{avatar:{x:0,y:12,w:36,h:80,mode:'full',z:9},el:{title:{x:34,y:7,w:61,h:12,fs:31,z:3},body:{x:34,y:23,w:60,h:65,fs:22,z:3}}}
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
  function normalizePresentation(raw,type,source,visualIndex,simMedia){
    const suggested=raw&&typeof raw==='object'&&SCENES.has(raw.scene)?raw.scene:null;
    let scene=suggested||inferredScene(type,source,visualIndex);
    // L'ouverture avatar seul est déjà créée par le lecteur avant les blocs du PDF. Un bloc de
    // contenu garde donc toujours une zone lisible, même si l'IA redemande avatar_only.
    if(scene==='avatar_only')scene='split_left';
    // Une simulation reçoit sa mise en scène dédiée (titre + simulation plein cadre, avatar
    // entier à côté) ; une vidéo garde la zone média large. Si l'IA avait demandé
    // activity_focus, l'iframe se retrouvait sans hauteur et seul le lien restait visible.
    const simSource=simMedia===undefined?!!(source&&source.kind==='simulation'):!!simMedia;
    const wideSource=!!(source&&source.kind==='video');
    if(simSource||wideSource)scene='media_focus';
    const openingExplanation=visualIndex===0&&!source&&type==='text';
    if(openingExplanation)scene='split_left';
    const avatarSize=openingExplanation?'full':(raw&&raw.avatarSize==='full'?'full':(raw&&raw.avatarSize==='reduced'?'reduced':(/^(question|summary)$/.test(type)?'full':'reduced')));
    const requestedPosition=raw&&['left','right','wide'].includes(raw.mediaPosition)?raw.mediaPosition:'';
    const mediaPosition=simSource?'sim':(wideSource?'wide':(requestedPosition||(visualIndex%2?'left':'right')));
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
  function simulationDocument(value){
    let document=typeof value==='string'?value.trim():'';
    if(!document)return '';
    // Certaines anciennes lignes ont reçu le document HTML déjà encodé. Ne décode que
    // lorsqu'il s'agit manifestement d'une page complète, pour ne pas modifier son contenu.
    if(/^&lt;\s*(?:!doctype|html)\b/i.test(document)){
      document=document.replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#0*39;|&#x0*27;/gi,"'").replace(/&amp;/gi,'&');
    }
    // Migration sans republication : les premières simulations SVG avaient bien les écouteurs
    // de glisser-déposer sur le groupe, mais leur dessin ignorait les clics. Ce petit correctif
    // ajoute une surface de saisie à chaque ancien objet après chaque nouveau rendu de la scène.
    if(/window\.CourseSimulation\s*=/.test(document)&&/data-element/.test(document)&&!/drag-hit/.test(document)&&/<\/body>/i.test(document)){
      const legacyDragPatch=`<script id="ccLegacyDragPatch">(()=>{const NS='http://www.w3.org/2000/svg',scene=document.getElementById('scene');if(!scene)return;const patch=()=>scene.querySelectorAll('g.draggable[data-element]').forEach(group=>{if(Array.from(group.children).some(node=>node.classList&&node.classList.contains('drag-hit')))return;const holder=Array.from(group.children).find(node=>node.tagName&&node.tagName.toLowerCase()==='g'&&node.getAttribute('pointer-events')==='none'),art=holder&&holder.querySelector('svg');if(!art)return;const hit=document.createElementNS(NS,'rect');hit.setAttribute('x',art.getAttribute('x')||'0');hit.setAttribute('y',art.getAttribute('y')||'0');hit.setAttribute('width',art.getAttribute('width')||'16');hit.setAttribute('height',art.getAttribute('height')||'16');hit.setAttribute('rx','2');hit.setAttribute('fill','transparent');hit.setAttribute('pointer-events','all');hit.setAttribute('class','drag-hit');group.insertBefore(hit,group.firstChild)});new MutationObserver(patch).observe(scene,{childList:true,subtree:true});patch()})();<\/script>`;
      document=document.replace(/<\/body>/i,legacyDragPatch+'</body>');
    }
    return /^<\s*(?:!doctype|html)\b/i.test(document)?document:'';
  }
  function standaloneResourceStep(source,mediaIndex){
    const objective=plain(source.pedagogical_objective,240)||'Observer et exploiter cette ressource pédagogique.';
    const presentation=normalizePresentation({scene:'media_focus',avatarSize:'reduced'},source.kind,source,mediaIndex);
    const media=sourceMedia(source,source.file_name,objective),hold=['video','simulation','audio','link'].includes(media.type);
    return {phase:'concept',say:`Regardons maintenant le support ${plain(source.file_name,180)}. ${objective}`,pauseForAnswer:hold,
      board:{title:media.type==='simulation'?'':html(source.file_name||'Support pédagogique'),lines:media.type==='simulation'?[]:boardLines(objective,2),media},presentation};
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
    const q=html(plain(raw.question||fallback,500)),enonce=html(plain(raw.enonce,500)),fb=html(plain(raw.feedback,500)),svg=typeof raw.questionSvg==='string'?raw.questionSvg:'';
    if(kind==='qcm'){
      const options=(Array.isArray(raw.options)?raw.options:[]).map(x=>html(plain(x,180))).filter(Boolean).slice(0,6);
      const optionSvgs=(Array.isArray(raw.optionSvgs)?raw.optionSvgs:[]).slice(0,options.length).map(value=>typeof value==='string'?value:'');
      if(options.length>=2)return {type:'qcm',enonce,q,svg,options,optionSvgs,correct:Math.max(0,Math.min(options.length-1,Number(raw.correctIndex)||0)),fb};
    }
    if(kind==='vf')return {type:'vf',enonce,q,svg,correct:raw.correctBoolean===true,fb};
    if(kind==='association'){
      const pairs=(Array.isArray(raw.pairs)?raw.pairs:[]).map(pair=>({l:html(plain(pair&&pair.left,160)),r:html(plain(pair&&pair.right,160)),lSvg:typeof (pair&&pair.leftSvg)==='string'?pair.leftSvg:'',rSvg:typeof (pair&&pair.rightSvg)==='string'?pair.rightSvg:''})).filter(pair=>pair.l&&pair.r).slice(0,6);
      if(pairs.length>=2)return {type:'association',enonce,q,svg,pairs,fb};
    }
    const attendus=(Array.isArray(raw.expectedKeywords)?raw.expectedKeywords:[]).map(x=>plain(x,100)).filter(Boolean).slice(0,10);
    return {type:'libre',enonce,q,svg,attendus:attendus.length?attendus:[plain(raw.expectedAnswer,120)||'réponse attendue'],reponse:html(plain(raw.expectedAnswer,400)),fb};
  }
  function plannedQuizSets(rawSets){
    return (Array.isArray(rawSets)?rawSets:[]).slice(0,3).map((set,index)=>{
      const quiz=(Array.isArray(set&&set.questions)?set.questions:[]).map((question,questionIndex)=>evaluationQuestion(question,`Question ${questionIndex+1}`)).filter(Boolean).slice(0,5);
      return {label:plain(set&&set.label,120)||`Evaluation ${index+1}`,intro:plain(set&&set.intro,300),quiz};
    }).filter(set=>set.quiz.length);
  }
  function stepFromBlock(row,source,chunk,chunkIndex,chunkCount,sessionTitle,visualIndex,mediaIndex,sessionRows,primary){
    const type=row.block_type||'text',content=row.content&&typeof row.content==='object'?row.content:{};
    const rawTitle=plain(row.title||'Partie du cours',180),objective=plain(row.objective,300);
    const vagueTitle=/^(?:je|j['’])\s*(?:vois|regarde|écoute|observe|découvre|retiens)\s*[.!…]*$/i.test(rawTitle);
    const title=vagueTitle&&objective?compact(objective,90):rawTitle;
    const shownTitle=chunkCount>1?`${title} (${chunkIndex+1}/${chunkCount})`:title;
    const inlineSimulation=type==='simulation'?simulationDocument(content.simulation_html):'';
    const hasSimMedia=!!inlineSimulation||!!(source&&source.kind==='simulation'&&source.url);
    let presentation=normalizePresentation(content.presentation,type,source,source?mediaIndex:visualIndex,hasSimMedia);
    // Double piste produite par l'import : content.say = script oral du professeur,
    // content.board_lines = trace écrite. Sans elles (anciens cours), le texte unique
    // est à la fois parlé et découpé en lignes comme avant.
    const spokenScript=plain(content.say,1900);
    const customBoard=(Array.isArray(content.board_lines)?content.board_lines:[])
      .map(line=>({t:plain(line&&line.t,170),cls:['def','ex','imp','sub'].includes(line&&line.cls)?line.cls:''}))
      .filter(line=>line.t).slice(0,6);
    const writtenSource=spokenScript?plain(content.text||row.objective||chunk,2200):chunk;
    const board={title:html(shownTitle),lines:customBoard.length?customBoard.map(line=>({t:html(line.t),cls:line.cls})):boardLines(writtenSource,presentation.scene==='media_focus'?2:5)};
    if(type==='question'){
      board.probleme=html(customBoard.length?customBoard.map(line=>line.t).join(' '):(spokenScript?compact(writtenSource,300):chunk));board.lines=[];
      board.problemeTag=/situation\s*[-–—]?\s*probl[èe]me/i.test(`${title} ${objective}`)?'Situation-problème':'Question à la classe';
    }
    // Le document intégré est prioritaire : certains stockages servent les fichiers HTML avec
    // un type texte, ce qui afficherait leur code source au lieu d'exécuter la simulation.
    if(inlineSimulation){
      board.media={type:'simulation',kind:'simulation',srcdoc:inlineSimulation,desc:title,objective};
    }else if(source&&source.url){
      board.media=sourceMedia(source,title,chunk);if(!board.media.objective)board.media.objective=objective;
    }
    if(type==='image'&&board.media&&content.image&&typeof content.image==='object'){
      board.media.desc=plain(content.image.caption,220)||title;
      board.media.alt=plain(content.image.alt,260)||board.media.desc;
    }
    // La simulation est le tableau : aucun titre ni aucune ligne du bloc ne doit se superposer
    // à l'iframe. La consigne et les libellés vivent déjà dans la simulation et dans la voix.
    if(hasSimMedia){board.title='';board.lines=[];delete board.probleme;delete board.problemeTag;}
    // Mise en scène « média » sans média réel (image non générée, fichier manquant) : le texte
    // reprend la grande zone centrale au lieu de rester dans la colonne étroite prévue à côté
    // d'un visuel absent, et le tableau est reconstruit avec le nombre de lignes d'un vrai
    // écran de texte.
    if(!board.media&&presentation.scene==='media_focus'){
      presentation=normalizePresentation({scene:'board_focus',avatarSize:'reduced'},type,null,visualIndex,false);
      if(!customBoard.length&&type!=='question')board.lines=boardLines(writtenSource,5);
    }
    // Au primaire, la trace écrite doit se lire de loin : polices nettement plus grandes
    // sur les zones de texte (les mises en page sont générées par étape, on peut les ajuster).
    if(primary&&presentation.layout&&presentation.layout.el){
      ['title','body','probleme'].forEach(key=>{
        const zone=presentation.layout.el[key];
        if(zone&&zone.fs)zone.fs=Math.round(zone.fs*1.35);
      });
    }
    if(type==='activity'){
      const interactive=activityBoard(content.activity,sessionRows);if(interactive)Object.assign(board,interactive);
    }
    if(presentation.scene==='board_focus'&&chunkIndex===0)board.linesAfterSpeech=true;
    const lead=type==='image'?'Observe attentivement cette image. ':type==='schema'?'Regardons comment ce schéma est organisé. ':type==='video'?'Observe cette vidéo avant de retenir l’explication. ':type==='simulation'?'Manipule la simulation et observe le résultat. ':type==='activity'?'À toi de participer au tableau. ':type==='question'||type==='evaluation'?'Je te laisse quelques instants pour répondre. ':type==='summary'?'Retenons l’essentiel. ':'';
    const holdForResource=!!(board.media&&['video','simulation','audio','link'].includes(board.media.type));
    const phase=type==='question'&&board.problemeTag!=='Situation-problème'?'structuration':(PHASE_BY_TYPE[type]||'concept');
    // Le script oral écrit par l'IA contient déjà accroche, consigne et renvois au tableau :
    // il est prononcé tel quel, sans re-préfixer mécaniquement le titre du bloc.
    const say=spokenScript||`${shownTitle}. ${lead}${chunk}`;
    return {phase,say:say.slice(0,1950),board,presentation,pauseForAnswer:type==='question'||holdForResource,studentQuestion:type==='question'};
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
    const target=analysis.targetContext||(course.settings&&course.settings.target_context)||{subjectName:course.subjects&&course.subjects.name,gradeLevelName:course.grade_levels&&course.grade_levels.name,streamName:course.study_streams&&course.study_streams.name};
    const gameMode=/préscolaire|primaire|apep|grande\s+section|\bcp\b/i.test(`${target.cycle||''} ${target.gradeLevelName||''} ${target.gradeLevelCode||''}`);
    const sessionNames={};(analysis.sessions||[]).forEach((item,index)=>sessionNames[index]=plain(item&&item.title,180));
    const etapes=[{intro:true,say:`Bienvenue dans le cours ${plain(course.title,180)}. ${plain(course.description||analysis.summary,1200)} Aujourd'hui, je vais te guider avec des explications, des ressources à observer et des moments où tu participeras au tableau.`,board:{title:'',lines:[]},presentation:{scene:'avatar_only',avatarSize:'full',layout:INTRO_LAYOUT}}];
    const grouped={};(blocks||[]).forEach(row=>(grouped[row.session_position]||(grouped[row.session_position]=[])).push(row));
    const quizSets=plannedQuizSets(analysis.evaluationSets);
    const hasPlannedQuizSets=quizSets.length>0;
    let visualIndex=0,mediaIndex=0;
    Object.keys(grouped).map(Number).sort((a,b)=>a-b).forEach(sessionPosition=>{
      const rows=grouped[sessionPosition],sessionTitle=plain((rows[0]&&rows[0].content&&rows[0].content.session_title)||sessionNames[sessionPosition]||`Séance ${sessionPosition+1}`,180);
      const sessionRows=rows.filter(row=>!['question','evaluation','activity','simulation'].includes(row.block_type)).map(row=>({title:plain(row.title,100),clue:plain(row.objective||(row.content&&row.content.text),180)}));
      rows.forEach(row=>{
        // Les évaluations vivent dans l'espace Jeux/Quiz. Les rejouer comme des diapositives
        // créait autant de faux cadres « situation-problème » dans la leçon.
        if(row.block_type==='evaluation')return;
        const content=row.content&&typeof row.content==='object'?row.content:{};
        // Un bloc avec script oral dédié devient UNE étape (le say est déjà calibré) ;
        // sinon l'ancien texte unique est découpé en morceaux parlables.
        const spoken=plain(content.say,1900);
        const text=plain(content.text||row.objective||row.title,12000),parts=spoken?[spoken]:chunks(text);
        const source=sourceForRow(row,sourceMap,allSources);if(source)usedSourceIds.add(source.id);
        parts.forEach((part,index)=>{etapes.push(stepFromBlock(row,source,part,index,parts.length,sessionTitle,visualIndex++,source?mediaIndex++:mediaIndex,sessionRows,gameMode));});
      });
      const evaluationRows=rows.filter(row=>row.block_type==='evaluation');
      const sessionQuiz=evaluationRows.map(row=>evaluationQuestion(row.content&&row.content.evaluation,(row.content&&row.content.text)||row.title)).filter(Boolean);
      if(!hasPlannedQuizSets&&gameMode){
        sessionQuiz.forEach((question,index)=>{const row=evaluationRows[index]||{};quizSets.push({label:`Jeu · ${plain(row.title,100)||sessionTitle}`,intro:plain(row.objective,220)||`Joue pour vérifier ce que tu as appris.`,quiz:[question]})});
      }else if(!hasPlannedQuizSets&&sessionQuiz.length)quizSets.push({label:`Évaluation · ${sessionTitle}`,intro:`Vérifie les objectifs de ${sessionTitle}.`,quiz:sessionQuiz});
    });
    const unusedSources=allSources.filter(source=>source.url&&!usedSourceIds.has(source.id));
    unusedSources.forEach(source=>etapes.push(standaloneResourceStep(source,mediaIndex++)));
    if(etapes.length===1)throw new Error('Ce cours ne contient aucun bloc publié.');
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
    return {id:'published-'+course.id,imported:true,publishedCourseId:course.id,courseStatus:course.status,courseAudioToken:owner&&session?session.access_token:'',sem:'PDF',titre:plain(course.title,180),description:plain(course.description||analysis.summary,1500),targetLabel,targetContext:target,aiContext:context,suggestedQuestions,quizSets,quizGameMode:gameMode,audioMap,theme:{name:'cours-importé',text:'#f8fafc',key:'#fde68a',accent:'#38bdf8'},etapes};
  }
  // Empreinte stable d'un texte parlé (djb2) : partagée entre l'enregistrement à la
  // première lecture, la carte audio du cours et le lecteur (index.html).
  function ccTextHash(text){
    text=String(text||'').trim();
    let h=5381;
    for(let i=0;i<text.length;i++)h=((h<<5)+h+text.charCodeAt(i))>>>0;
    return 'h'+h.toString(36)+'-'+text.length;
  }
  if(typeof window!=='undefined'){
    window.ccTextHash=ccTextHash;
    window.ccStudentQuestionReturnStep=studentQuestionReturnStep;
    window.ccSimulationStateCompleted=simulationStateCompleted;
    window.loadPublishedCourseLesson=loadPublishedCourseLesson;
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={INTRO_LAYOUT,layoutForScene,normalizePresentation,evaluationQuestion,plannedQuizSets,simulationDocument,simulationStateCompleted,stepFromBlock,studentQuestionReturnStep,ccTextHash};
})();
