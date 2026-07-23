(function(){
  'use strict';
  const $=id=>document.getElementById(id),state={courses:[],hiddenDefaults:[],admin:false,session:null};
  function safe(value){return String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
  function progress(course){try{const saved=JSON.parse(localStorage.getItem('cc_course_progress_'+course.id))||{},done=(saved.done||[]).length,total=Number(course.course_blocks&&course.course_blocks[0]&&course.course_blocks[0].count||0);return{done,total,percent:total?Math.round(done/total*100):0}}catch(e){return{done:0,total:0,percent:0}}}
  function button(label,danger,handler){const b=document.createElement('button');b.type='button';if(danger)b.className='danger';b.textContent=label;b.onclick=handler;return b}
  function link(label,href){const a=document.createElement('a');a.href=href;a.textContent=label;return a}

  // Ce cours local est publié dans la bibliothèque avec les cours Supabase.
  // Son lecteur utilise le chapitre intégré afin de rester disponible sans compte professeur.
  const LOCAL_M1={id:'son-m-nouveau',subject_id:'local-francais',grade_level_id:'local-gs-cp',title:'Cours M 1',description:'Cours de phonologie : produire le son [m], le repérer dans les mots et reconnaître M, m et 𝓂 avec des images et cinq simulations nouvelles.',settings:{duration_minutes:40},subjects:{name:'Français',color:'#155e75'},grade_levels:{name:'Grande Section / CP'}};

  // ---- Cours publiés (Supabase) : visibles par TOUS, gérables par l'administrateur ----
  function render(){
    const term=$('search').value.trim().toLowerCase(),subject=$('subjectFilter').value,grade=$('gradeFilter').value;
    const published=[LOCAL_M1,...state.courses.filter(course=>course.id!==LOCAL_M1.id)];
    const courses=published.filter(course=>(!subject||course.subject_id===subject)&&(!grade||course.grade_level_id===grade)&&(!term||(course.title+' '+course.description+' '+(course.subjects&&course.subjects.name||'')+' '+(course.grade_levels&&course.grade_levels.name||'')).toLowerCase().includes(term)));
    $('resultCount').textContent=`${courses.length} cours disponible${courses.length>1?'s':''}`;const grid=$('courseGrid');grid.innerHTML='';
    courses.forEach(course=>{const p=progress(course),hours=Math.round(Number(course.settings&&course.settings.duration_minutes||0)/6)/10,card=document.createElement('article');card.className='card';card.style.setProperty('--course-color',course.subjects&&course.subjects.color||'#0f7b5f');const openUrl=course.id===LOCAL_M1.id?'index.html?chapitre=son-m-nouveau':'index.html?course='+encodeURIComponent(course.id);const meta=course.id===LOCAL_M1.id?'5 simulations · 8 étapes · 0% terminé':`${hours?hours+' h · ':''}${p.total} blocs · ${p.percent}% terminé`;card.innerHTML=`<div class="card-top"></div><div class="card-body"><div class="tags"><span class="tag">${safe(course.subjects&&course.subjects.name||'Cours')}</span><span class="tag">${safe(course.grade_levels&&course.grade_levels.name||'Tous niveaux')}</span></div><h3>${safe(course.title)}</h3><div class="description">${safe(course.description||'Cours pédagogique structuré par le professeur.')}</div><div class="progress"><i style="width:${p.percent}%"></i></div><div class="card-footer"><span class="meta">${meta}</span><a class="open" href="${openUrl}">▶ Ouvrir avec l’avatar</a></div></div>`;
      if(state.admin&&course.id!==LOCAL_M1.id){
        const actions=document.createElement('div');actions.className='admin-actions';
        actions.appendChild(link('✏️ Modifier','prof.html?course='+encodeURIComponent(course.id)+'&boards=1'));
        actions.appendChild(button('⏸ Dépublier',false,()=>unpublishCourse(course)));
        actions.appendChild(button('🗑 Supprimer',true,()=>deleteCourse(course)));
        card.querySelector('.card-body').appendChild(actions);
      }
      grid.appendChild(card)});
    if(!courses.length)grid.innerHTML='<div class="empty">Aucun cours ne correspond à cette recherche.</div>';
  }

  async function unpublishCourse(course){
    if(!confirm('Dépublier « '+course.title+' » ?\nIl disparaîtra de cette page mais restera modifiable en brouillon.'))return;
    try{
      if(!window.AdminCourseManager)throw new Error('module de gestion administrateur indisponible');
      await window.AdminCourseManager.updateStatus(window.classesSupabase,course.id,'draft');
      state.courses=state.courses.filter(c=>c.id!==course.id);render();
    }catch(error){alert('Dépublication impossible : '+(error.message||error))}
  }
  // La suppression du cours parent efface ses données enfants en cascade, puis le
  // gestionnaire commun nettoie les fichiers privés associés dans Storage.
  async function deleteCourse(course){
    if(!confirm('SUPPRIMER définitivement « '+course.title+' » ?\nLes tableaux, ressources et voix associés seront effacés. Cette action est irréversible.'))return;
    try{
      if(!window.AdminCourseManager)throw new Error('module de gestion administrateur indisponible');
      const result=await window.AdminCourseManager.deleteCourse(window.classesSupabase,course);
      state.courses=state.courses.filter(c=>c.id!==course.id);render();
      if(result.warning)alert(result.warning);
    }catch(error){alert('Suppression impossible ('+(error.message||error)+')')}
  }

  // ---- Cours de démonstration (lecons.js) : l'admin peut les masquer pour tout le monde ----
  function renderDemos(){
    const grid=$('demoGrid'),lessons=Array.isArray(window.LECONS)?window.LECONS:[];grid.innerHTML='';
    const hidden=new Set(state.hiddenDefaults);
    const shown=lessons.filter(lesson=>lesson.id!==LOCAL_M1.id&&(state.admin||!hidden.has(lesson.id)));
    $('demoCount').textContent=shown.length?`${shown.length} chapitre${shown.length>1?'s':''} intégré${shown.length>1?'s':''}`:'';
    shown.forEach(lesson=>{
      const isHidden=hidden.has(lesson.id);
      const card=document.createElement('article');card.className='card'+(isHidden?' hidden-card':'');card.style.setProperty('--course-color','#155e75');
      const subject=lesson.subjectLabel||'SVT',grade=lesson.gradeLabel||'3e année collège',category=lesson.categoryLabel||'Démo intégrée';
      card.innerHTML=`<div class="card-top"></div><div class="card-body"><div class="tags"><span class="tag">${safe(subject)}</span><span class="tag">${safe(grade)}</span><span class="tag">${safe(category)}</span>${isHidden?'<span class="tag hidden-badge">Masqué pour les élèves</span>':''}</div><h3>${safe(lesson.titre)}</h3><div class="description">Cours interactif prêt à jouer avec l’avatar : explications, gestes, images, simulations et évaluation.</div><div class="card-footer"><span class="meta">${(lesson.etapes||[]).length} étapes</span><a class="open" href="index.html?chapitre=${encodeURIComponent(lesson.id)}">▶ Ouvrir avec l’avatar</a></div></div>`;
      if(state.admin){
        const actions=document.createElement('div');actions.className='admin-actions';
        actions.appendChild(link('✏️ Modifier','prof.html?chapitre='+encodeURIComponent(lesson.id)));
        actions.appendChild(isHidden
          ?button('↩ Réafficher pour tous',false,()=>setDefaultHidden(lesson,false))
          :button('🗑 Retirer de l’accueil',true,()=>setDefaultHidden(lesson,true)));
        card.querySelector('.card-body').appendChild(actions);
      }
      grid.appendChild(card);
    });
    if(!shown.length)grid.innerHTML='<div class="empty">Aucun cours de démonstration disponible.</div>';
  }

  async function setDefaultHidden(lesson,hidden){
    if(hidden&&!confirm('Retirer « '+lesson.titre+' » de l’accueil et du lecteur pour tout le monde ?\n(Le cours n’est pas supprimé : vous pourrez le réafficher ici.)'))return;
    try{
      const token=state.session&&state.session.access_token;if(!token)throw new Error('session expirée');
      const response=await fetch('/api/default-courses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({chapterId:lesson.id,hidden})});
      const body=await response.json();if(!response.ok)throw new Error(body.error||'échec');
      state.hiddenDefaults=Array.isArray(body.hidden)?body.hidden:[];renderDemos();
    }catch(error){alert('Modification impossible : '+(error.message||error))}
  }

  async function init(){
    try{const defaults=await fetch('/api/default-courses').then(r=>r.ok?r.json():{}).catch(()=>({}));state.hiddenDefaults=Array.isArray(defaults.hidden)?defaults.hidden:[]}catch(e){}
    renderDemos();
    try{
      await window.teacherAuthReady;const sb=window.classesSupabase,{data:{session}}=await sb.auth.getSession();state.session=session||null;
      if(session&&session.user){const {data:profile}=await sb.from('profiles').select('role').eq('id',session.user.id).maybeSingle();state.admin=!!(profile&&profile.role==='admin')}
      // Tous les cours publiés sont visibles par tout le monde, connecté ou non.
      const {data,error}=await sb.from('courses').select('id,teacher_id,subject_id,grade_level_id,title,description,settings,subjects(code,name,color),grade_levels(code,name,sort_order),course_blocks(count)').eq('status','published').order('updated_at',{ascending:false});if(error)throw error;state.courses=data||[];
      const subjects=[...new Map(state.courses.filter(x=>x.subjects).map(x=>[x.subject_id,x.subjects.name])).entries()].sort((a,b)=>a[1].localeCompare(b[1],'fr'));subjects.forEach(([id,name])=>{const option=document.createElement('option');option.value=id;option.textContent=name;$('subjectFilter').appendChild(option)});
      const grades=[...new Map(state.courses.filter(x=>x.grade_levels).map(x=>[x.grade_level_id,x.grade_levels])).entries()].sort((a,b)=>Number(a[1].sort_order||0)-Number(b[1].sort_order||0));grades.forEach(([id,grade])=>{const option=document.createElement('option');option.value=id;option.textContent=grade.name;$('gradeFilter').appendChild(option)});
      $('search').oninput=render;$('subjectFilter').onchange=render;$('gradeFilter').onchange=render;render();renderDemos();
    }catch(error){$('resultCount').textContent='Indisponible';$('courseGrid').innerHTML='<div class="empty">Impossible de charger les cours publiés. Vérifiez la connexion puis réessayez.</div>'}
  }
  init();
})();
