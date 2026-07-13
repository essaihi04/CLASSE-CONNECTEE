(function(){
  'use strict';
  const PHASE_BY_TYPE={
    text:'concept',image:'concept',video:'hypothese',schema:'structuration',simulation:'concept',
    activity:'structuration',question:'probleme',summary:'bilan',evaluation:'bilan'
  };
  const MEDIA_KINDS=new Set(['image','schema','video']);

  function html(value){return String(value??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}
  function attr(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function plain(value,max=8000){return String(value??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
  function chunks(text,max=1750){
    const sentences=plain(text,12000).split(/(?<=[.!?…])\s+/).filter(Boolean),out=[];let current='';
    const push=value=>{value=plain(value,max);if(value)out.push(value)};
    sentences.forEach(sentence=>{
      if(sentence.length>max){if(current){push(current);current=''}for(let start=0;start<sentence.length;start+=max)push(sentence.slice(start,start+max));return}
      if(current&&current.length+sentence.length+1>max){push(current);current=sentence}else current+=(current?' ':'')+sentence;
    });
    if(current)push(current);return out.length?out:['Contenu à compléter par le professeur.'];
  }
  function boardLines(text){
    const words=plain(text,2200).split(/\s+/).filter(Boolean),lines=[];let current='';
    words.forEach(word=>{if(current&&current.length+word.length+1>185){lines.push(current);current=word}else current+=(current?' ':'')+word});
    if(current)lines.push(current);
    return lines.slice(0,10).map((line,index)=>({t:html(line),cls:index===0?'def':''}));
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
  function stepFromBlock(row,source,chunk,chunkIndex,chunkCount,sessionTitle){
    const type=row.block_type||'text',title=plain(row.title||'Partie du cours',180),objective=plain(row.objective,300);
    const shownTitle=chunkCount>1?`${title} (${chunkIndex+1}/${chunkCount})`:title;
    const board={title:html(shownTitle),lines:boardLines(chunk)};
    if(type==='question'||type==='evaluation')board.probleme=html(chunk);
    if(source&&source.url&&MEDIA_KINDS.has(source.kind)){
      board.media={type:source.kind==='video'?'video':'image',src:source.url,desc:plain(source.file_name||title,180).replace(/["<>]/g,''),explain:chunk};
    }else if(source&&source.url){
      board.lines.push({t:`<a href="${attr(source.url)}" target="_blank" rel="noopener">Ouvrir la ressource : ${html(source.file_name||'support pédagogique')}</a>`,cls:'imp'});
    }
    const lead=type==='image'?'Observe attentivement cette image. ':type==='schema'?'Regardons comment ce schéma est organisé. ':type==='video'?'Observe cette vidéo avant de retenir l’explication. ':type==='simulation'?'Manipule la simulation et observe le résultat. ':type==='activity'?'Réalisons maintenant cette activité. ':type==='question'||type==='evaluation'?'Réfléchis à cette question. ':type==='summary'?'Retenons l’essentiel. ':'';
    return {phase:PHASE_BY_TYPE[type]||'concept',say:`${sessionTitle?sessionTitle+'. ':''}${shownTitle}. ${lead}${chunk}${objective?' Objectif : '+objective:''}`.slice(0,1950),board};
  }
  async function loadPublishedCourseLesson(courseId){
    if(!/^[0-9a-f-]{36}$/i.test(courseId||''))throw new Error('Identifiant de cours invalide.');
    const sb=client(),{data:{session}}=await sb.auth.getSession();
    const [{data:course,error:courseError},{data:imports,error:importError},{data:blocks,error:blockError},{data:sources,error:sourceError}]=await Promise.all([
      sb.from('courses').select('id,teacher_id,title,description,status,settings').eq('id',courseId).single(),
      sb.from('course_imports').select('analysis,duration_minutes,created_at').eq('course_id',courseId).order('created_at',{ascending:false}).limit(1),
      sb.from('course_blocks').select('id,session_position,position,block_type,title,duration_minutes,objective,content,source_id,status').eq('course_id',courseId).order('session_position',{ascending:true}).order('position',{ascending:true}),
      sb.from('course_sources').select('id,kind,file_name,mime_type,storage_path,pedagogical_objective').eq('course_id',courseId)
    ]);
    if(courseError)throw courseError;if(importError)throw importError;if(blockError)throw blockError;if(sourceError)throw sourceError;
    const owner=!!(session&&session.user&&session.user.id===course.teacher_id);
    if(course.status!=='published'&&!owner)throw new Error('Ce cours n’est pas publié.');
    if(session&&session.user&&!owner)throw new Error('Ce cours appartient à un autre professeur.');
    const sourceMap=await signedSources(sb,sources||[]),analysis=imports&&imports[0]&&imports[0].analysis||{};
    const sessionNames={};(analysis.sessions||[]).forEach((item,index)=>sessionNames[index]=plain(item&&item.title,180));
    const etapes=[{intro:true,say:`Bienvenue dans le cours ${plain(course.title,180)}. ${plain(course.description||analysis.summary,1200)} Nous allons parcourir ensemble toutes les notions et les ressources préparées par ton professeur.`,board:{title:'',lines:[]}}];
    (blocks||[]).forEach(row=>{
      const content=row.content&&typeof row.content==='object'?row.content:{};
      const text=plain(content.text||row.objective||row.title,12000),parts=chunks(text);
      const sessionTitle=plain(content.session_title||sessionNames[row.session_position]||`Séance ${Number(row.session_position||0)+1}`,180);
      parts.forEach((part,index)=>etapes.push(stepFromBlock(row,sourceMap[row.source_id],part,index,parts.length,sessionTitle)));
    });
    if(etapes.length===1)throw new Error('Ce cours ne contient aucun bloc publié.');
    const context=(blocks||[]).map(row=>`${plain(row.title,180)} : ${plain(row.content&&row.content.text||row.objective,800)}`).join('\n').slice(0,6500);
    const suggestedQuestions=(blocks||[]).filter(row=>row.block_type==='question'||row.block_type==='evaluation').map(row=>plain(row.title,90)).filter(Boolean).slice(0,4);
    if(!suggestedQuestions.length)suggestedQuestions.push('Résume ce cours','Réexplique la notion principale','Quel est le point le plus important ?','Propose-moi une question de révision');
    return {id:'published-'+course.id,imported:true,publishedCourseId:course.id,sem:'PDF',titre:plain(course.title,180),description:plain(course.description||analysis.summary,1500),aiContext:context,suggestedQuestions,etapes};
  }
  window.loadPublishedCourseLesson=loadPublishedCourseLesson;
})();
