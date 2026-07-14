(function(){
  const config=window.CLASSES_SUPABASE||{};
  const configured=typeof config.url==='string' && /^https:\/\/.+\.supabase\.co$/i.test(config.url)
    && typeof config.anonKey==='string' && config.anonKey.length>40 && !config.anonKey.startsWith('REMPLACEZ_');
  const isLogin=document.documentElement.dataset.authPage==='login';
  const isProtected=document.documentElement.dataset.requiresTeacher==='true';
  const isLegacyRequired=document.documentElement.dataset.requiresLegacy==='true';
  const isAdminRequired=document.documentElement.dataset.requiresAdmin==='true';
  const nextPath=()=>{
    const raw=new URLSearchParams(location.search).get('next')||'prof.html';
    return /^[a-z0-9_-]+\.html(?:\?.*)?$/i.test(raw)?raw:'prof.html';
  };
  function showSetupError(message){
    document.documentElement.classList.remove('auth-pending');
    const target=document.getElementById('authNotice')||document.body;
    if(target) target.innerHTML='<div class="auth-error"><b>Configuration Supabase requise</b><br>'+message+'</div>';
  }
  if(!configured || !window.supabase){
    window.teacherAuthReady=Promise.reject(new Error('Supabase non configuré'));
    window.teacherAuthReady.catch(()=>{});
    document.addEventListener('DOMContentLoaded',()=>showSetupError('Ajoutez votre nouvelle clé anon / publishable dans <code>prototype/supabase-config.js</code>, puis rechargez la page.'));
    return;
  }
  const client=window.supabase.createClient(config.url,config.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  window.classesSupabase=client;
  async function setTeacherUi(session){
    const name=session.user.user_metadata&&session.user.user_metadata.first_name;
    document.querySelectorAll('[data-teacher-name]').forEach(el=>el.textContent=name||session.user.email||'Professeur');
    const logout=document.getElementById('logoutBtn');
    if(logout) logout.onclick=async()=>{ logout.disabled=true; await client.auth.signOut(); location.replace('login.html'); };
  }
  async function requireTeacher(){
    const {data:{session},error}=await client.auth.getSession();
    if(error) throw error;
    if(!session){ const page=location.pathname.split('/').pop()||'prof.html'; location.replace('login.html?next='+encodeURIComponent(page+location.search)); return new Promise(()=>{}); }
    const {data:profile,error:profileError}=await client.from('profiles').select('id,role,first_name,last_name,onboarding_complete,legacy_access').eq('id',session.user.id).maybeSingle();
    if(profileError) throw profileError;
    if(!profile || !profile.onboarding_complete){
      await client.auth.signOut();
      location.replace('login.html?notice=profile');
      return new Promise(()=>{});
    }
    if(isLegacyRequired && !profile.legacy_access){
      location.replace('prof.html?notice=private-content');
      return new Promise(()=>{});
    }
    if(isAdminRequired && profile.role!=='admin'){
      location.replace('prof.html');
      return new Promise(()=>{});
    }
    window.currentTeacher={session,profile};
    document.documentElement.classList.remove('auth-pending');
    await new Promise(resolve=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',resolve,{once:true}):resolve());
    setTeacherUi(session);
    return window.currentTeacher;
  }
  window.teacherAuthReady=isProtected?requireTeacher():Promise.resolve(null);
  window.teacherAuthReady.catch(error=>{
    console.error('Authentification professeur :',error.message);
    document.addEventListener('DOMContentLoaded',()=>showSetupError('Impossible de vérifier votre session. Vérifiez la migration Supabase, l’URL et la clé publique.'));
  });
  if(!isLogin) return;
  document.addEventListener('DOMContentLoaded',async()=>{
    const notice=document.getElementById('authNotice');
    const loginForm=document.getElementById('loginForm');
    const signupForm=document.getElementById('signupForm');
    const loginTab=document.getElementById('loginTab');
    const signupTab=document.getElementById('signupTab');
    const setNotice=(message,kind='')=>{ notice.className='auth-notice '+kind; notice.textContent=message||''; };
    const show=(mode)=>{ const login=mode==='login'; loginForm.hidden=!login; signupForm.hidden=login; loginTab.classList.toggle('active',login); signupTab.classList.toggle('active',!login); setNotice(''); };
    loginTab.onclick=()=>show('login'); signupTab.onclick=()=>show('signup');
    const levelSelect=signupForm.grade_level_code, streamField=document.getElementById('streamField'), streamSelect=signupForm.stream_code;
    const syncStream=()=>{ const lycee=['tc','1bac','2bac'].includes(levelSelect.value); streamField.hidden=!lycee; if(!lycee) streamSelect.value='general'; else if(!streamSelect.value) streamSelect.value='sciences_maths'; };
    levelSelect.onchange=syncStream; syncStream();
    const {data:{session}}=await client.auth.getSession(); if(session){ location.replace(nextPath()); return; }
    if(new URLSearchParams(location.search).get('notice')==='profile') setNotice('Votre profil n’a pas été créé. Réessayez l’inscription ou vérifiez la migration SQL.','error');
    const run=async(form,work)=>{ const submit=form.querySelector('button[type=submit]'); submit.disabled=true; try{ await work(); }catch(error){ setNotice(error.message||'Une erreur est survenue.','error'); }finally{ submit.disabled=false; } };
    loginForm.onsubmit=e=>{ e.preventDefault(); run(loginForm,async()=>{
      const email=loginForm.email.value.trim(), password=loginForm.password.value;
      const {error}=await client.auth.signInWithPassword({email,password}); if(error) throw error;
      location.replace(nextPath());
    }); };
    signupForm.onsubmit=e=>{ e.preventDefault(); run(signupForm,async()=>{
      const firstName=signupForm.first_name.value.trim(), lastName=signupForm.last_name.value.trim();
      if(!firstName||!lastName) throw new Error('Indiquez votre prénom et votre nom.');
      const password=signupForm.password.value; if(password.length<8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
      const {data,error}=await client.auth.signUp({
        email:signupForm.email.value.trim(), password,
        options:{emailRedirectTo:new URL('login.html',location.origin).toString(),data:{
          first_name:firstName,last_name:lastName,school_name:signupForm.school_name.value.trim(),
          subject_code:signupForm.subject_code.value,grade_level_code:signupForm.grade_level_code.value,
          stream_code:signupForm.stream_code.value||'general'
        }}
      });
      if(error) throw error;
      if(data.session) location.replace(nextPath());
      else setNotice('Compte créé. Consultez votre e-mail pour confirmer votre adresse, puis connectez-vous.','success');
    }); };
    document.getElementById('forgotPassword').onclick=async()=>{
      const email=loginForm.email.value.trim(); if(!email){ setNotice('Saisissez d’abord votre adresse e-mail.','error'); return; }
      const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:new URL('login.html',location.origin).toString()});
      if(error) setNotice(error.message,'error'); else setNotice('Un lien de réinitialisation vient d’être envoyé.','success');
    };
  });
})();
