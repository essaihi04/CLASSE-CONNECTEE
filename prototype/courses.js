(function(){
  'use strict';
  const $=id=>document.getElementById(id),state={courses:[]};
  function safe(value){return String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
  function progress(course){try{const saved=JSON.parse(localStorage.getItem('cc_course_progress_'+course.id))||{},done=(saved.done||[]).length,total=Number(course.course_blocks&&course.course_blocks[0]&&course.course_blocks[0].count||0);return{done,total,percent:total?Math.round(done/total*100):0}}catch(e){return{done:0,total:0,percent:0}}}
  function render(){
    const term=$('search').value.trim().toLowerCase(),subject=$('subjectFilter').value;
    const courses=state.courses.filter(course=>(!subject||course.subject_id===subject)&&(!term||(course.title+' '+course.description+' '+(course.subjects&&course.subjects.name||'')).toLowerCase().includes(term)));
    $('resultCount').textContent=`${courses.length} cours disponible${courses.length>1?'s':''}`;const grid=$('courseGrid');grid.innerHTML='';
    courses.forEach(course=>{const p=progress(course),hours=Math.round(Number(course.settings&&course.settings.duration_minutes||0)/6)/10,card=document.createElement('article');card.className='card';card.style.setProperty('--course-color',course.subjects&&course.subjects.color||'#0f7b5f');card.innerHTML=`<div class="card-top"></div><div class="card-body"><div class="tags"><span class="tag">${safe(course.subjects&&course.subjects.name||'Cours')}</span><span class="tag">${safe(course.grade_levels&&course.grade_levels.name||'Tous niveaux')}</span></div><h3>${safe(course.title)}</h3><div class="description">${safe(course.description||'Cours pédagogique structuré par le professeur.')}</div><div class="progress"><i style="width:${p.percent}%"></i></div><div class="card-footer"><span class="meta">${hours?hours+' h · ':''}${p.total} blocs · ${p.percent}% terminé</span><a class="open" href="course-preview.html?course=${encodeURIComponent(course.id)}">Ouvrir →</a></div></div>`;grid.appendChild(card)});
    if(!courses.length)grid.innerHTML='<div class="empty">Aucun cours ne correspond à cette recherche.</div>';
  }
  async function init(){
    try{await window.teacherAuthReady;const sb=window.classesSupabase,{data:{session}}=await sb.auth.getSession();let query=sb.from('courses').select('id,subject_id,title,description,settings,subjects(name,color),grade_levels(name),course_blocks(count)').eq('status','published');if(session&&session.user)query=query.eq('teacher_id',session.user.id);const {data,error}=await query.order('updated_at',{ascending:false});if(error)throw error;state.courses=data||[];
      const subjects=[...new Map(state.courses.filter(x=>x.subjects).map(x=>[x.subject_id,x.subjects.name])).entries()];subjects.forEach(([id,name])=>{const option=document.createElement('option');option.value=id;option.textContent=name;$('subjectFilter').appendChild(option)});$('search').oninput=render;$('subjectFilter').onchange=render;render();
    }catch(error){$('resultCount').textContent='Indisponible';$('courseGrid').innerHTML='<div class="empty">Impossible de charger les cours publiés. Vérifiez la connexion puis réessayez.</div>'}
  }
  init();
})();
