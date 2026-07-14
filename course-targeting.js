'use strict';

const GRADE_PROFILES = {
  prescolaire: { cycle:'Préscolaire', stage:'Préscolaire', rules:'Privilégier l’oral, l’image, la manipulation et le jeu. Une consigne très courte à la fois, sans abstraction ni texte long.' },
  '1apep': { cycle:'Primaire', stage:'1re année primaire', rules:'Utiliser des phrases très courtes, un vocabulaire concret, des exemples du quotidien, beaucoup d’oral et d’images. Une seule opération mentale par consigne.' },
  '2apep': { cycle:'Primaire', stage:'2e année primaire', rules:'S’appuyer sur la lecture débutante, des phrases courtes, des manipulations guidées et des exercices en une ou deux étapes.' },
  '3apep': { cycle:'Primaire', stage:'3e année primaire', rules:'Introduire un vocabulaire disciplinaire simple, toujours expliqué par un exemple concret, puis proposer des activités guidées courtes.' },
  '4apep': { cycle:'Primaire', stage:'4e année primaire', rules:'Faire observer, comparer et justifier avec des phrases simples. Introduire progressivement tableaux, schémas et problèmes en quelques étapes.' },
  '5apep': { cycle:'Primaire', stage:'5e année primaire', rules:'Développer le raisonnement et l’autonomie avec des documents courts, un vocabulaire précis expliqué et des tâches progressives.' },
  '6apep': { cycle:'Primaire', stage:'6e année primaire', rules:'Préparer la transition vers le collège : raisonnement structuré, documents courts variés, synthèse guidée et évaluation adaptée au programme de 6e primaire.' },
  '1apic': { cycle:'Collège', stage:'1re année collège', rules:'Construire les notions du collège sans prérequis de 2e ou 3e année, avec démarche guidée, vocabulaire disciplinaire défini et premières justifications.' },
  '2apic': { cycle:'Collège', stage:'2e année collège', rules:'Mobiliser uniquement les acquis attendus jusqu’en 2e année collège, avec raisonnement progressif, analyse de documents et justification courte.' },
  '3apic': { cycle:'Collège', stage:'3e année collège', rules:'Viser les compétences exactes de 3e année collège, avec raisonnement structuré, analyse, argumentation et préparation aux évaluations de fin de cycle.' },
  tc: { cycle:'Lycée', stage:'Tronc commun', rules:'Employer le niveau d’abstraction du tronc commun, expliciter les nouveaux modèles et ne pas supposer les acquis de 1re ou 2e Bac.' },
  '1bac': { cycle:'Lycée', stage:'1re année baccalauréat', rules:'Adapter notions, méthodes et évaluation à la 1re Bac et à la filière indiquée, sans introduire les exigences propres à la 2e Bac.' },
  '2bac': { cycle:'Lycée', stage:'2e année baccalauréat', rules:'Respecter le programme et les exigences méthodologiques de 2e Bac ainsi que la filière indiquée, avec exercices et évaluations de niveau examen.' }
};

const SUBJECT_PROFILES = {
  maths: { family:'Sciences et mathématiques', rules:'Construire les notions par situation, manipulation ou représentation, expliciter la méthode, puis proposer un entraînement progressif. Toute donnée et tout résultat doivent être vérifiables.' },
  svt: { family:'Sciences expérimentales', rules:'Partir d’observations ou de documents, distinguer faits et interprétations, employer un vocabulaire biologique exact et conclure uniquement à partir des sources.' },
  pc: { family:'Sciences expérimentales', rules:'Relier observation, mesure, modèle et conclusion. Indiquer unités et conditions utiles, et ne jamais inventer une expérience ou une valeur absente de la source.' },
  sciences_activite: { family:'Éveil scientifique', rules:'Privilégier l’observation, le questionnement, la manipulation sûre, la comparaison et une conclusion simple adaptée à l’âge.' },
  informatique: { family:'Sciences et numérique', rules:'Procéder par démonstration, étapes courtes, essai et correction. Séparer clairement notion, procédure, exemple et exercice.' },
  technologie: { family:'Sciences et technologie', rules:'Relier besoin, objet, fonction, solution et usage par des exemples concrets, des schémas lisibles et des activités de conception adaptées.' },
  arabe: { family:'Langues et littérature', rules:'Travailler compréhension, lexique, structures de langue et expression selon le niveau exact. Les réponses doivent s’appuyer sur le texte fourni.' },
  amazighe: { family:'Langues et littérature', rules:'Travailler compréhension, lexique, structures de langue et expression selon le niveau exact. Les réponses doivent s’appuyer sur le texte fourni.' },
  francais: { family:'Langues et littérature', rules:'Travailler compréhension, lexique, grammaire et production selon le niveau exact, avec modèles courts et réemploi progressif.' },
  anglais: { family:'Langues et littérature', rules:'Adapter le lexique, les structures et les quatre compétences au niveau exact, avec consignes simples, modèles et réemploi en contexte.' },
  espagnol: { family:'Langues et littérature', rules:'Adapter le lexique, les structures et les compétences de communication au niveau exact, avec modèles et réemploi en contexte.' },
  allemand: { family:'Langues et littérature', rules:'Adapter le lexique, les structures et les compétences de communication au niveau exact, avec modèles et réemploi en contexte.' },
  histoire_geo: { family:'Histoire et géographie', rules:'Distinguer repères, sources, chronologie, espace et interprétation. Ne pas traiter le contenu comme une leçon scientifique expérimentale.' },
  philosophie: { family:'Philosophie', rules:'Construire problème, concepts, thèses, arguments et exemples. Distinguer clairement citation, idée d’auteur et explication.' },
  education_islamique: { family:'Éducation islamique', rules:'Respecter les textes et références fournis, expliquer valeurs et notions avec précision et proposer des situations d’application adaptées à l’âge.' },
  education_civique: { family:'Éducation civique', rules:'Relier droits, devoirs, valeurs et institutions à des situations concrètes, en distinguant règle, exemple et justification.' },
  economie_gestion: { family:'Économie et gestion', rules:'Définir les notions, les relier à des situations économiques concrètes et faire interpréter données, mécanismes et décisions.' },
  comptabilite: { family:'Économie et gestion', rules:'Présenter chaque procédure pas à pas, avec pièces, écritures, contrôles et exercices chiffrés cohérents.' },
  droit: { family:'Droit', rules:'Distinguer faits, règle applicable, qualification et conclusion. Ne jamais inventer une règle ou une référence absente de la source.' },
  education_physique: { family:'Éducation physique et sportive', rules:'Décrire objectifs moteurs, consignes, sécurité, critères de réussite et progression, avec un effort adapté à l’âge.' },
  arts_plastiques: { family:'Arts', rules:'Faire observer, expérimenter un procédé, créer puis verbaliser les choix, sans imposer une unique réponse esthétique.' },
  education_musicale: { family:'Arts', rules:'Alterner écoute, repérage, pratique et verbalisation avec un vocabulaire musical adapté au niveau.' }
};

function related(value){ return Array.isArray(value) ? value[0] : value; }

function getCourseTarget(assignment){
  const subject=related(assignment&&assignment.subjects)||{};
  const grade=related(assignment&&assignment.grade_levels)||{};
  const stream=related(assignment&&assignment.study_streams)||{};
  const subjectCode=String(subject.code||assignment&&assignment.subject_code||'').trim();
  const gradeLevelCode=String(grade.code||assignment&&assignment.grade_level_code||'').trim();
  const gradeProfile=GRADE_PROFILES[gradeLevelCode]||{cycle:'Niveau scolaire',stage:String(grade.name||gradeLevelCode||'Niveau non précisé'),rules:'Employer uniquement les prérequis, le vocabulaire et les tâches attendus pour le niveau exact indiqué.'};
  const subjectProfile=SUBJECT_PROFILES[subjectCode]||{family:'Discipline',rules:'Rester strictement dans la matière sélectionnée et employer ses méthodes, ses documents et ses formes d’évaluation propres.'};
  return {
    assignmentId:String(assignment&&assignment.id||''),
    subjectCode,
    subjectName:String(subject.name||subjectCode||'Matière non précisée'),
    gradeLevelCode,
    gradeLevelName:String(grade.name||gradeProfile.stage),
    cycle:gradeProfile.cycle,
    stage:gradeProfile.stage,
    streamCode:String(stream.code||''),
    streamName:String(stream.name&&stream.name!=='Sans filière'?stream.name:''),
    disciplineFamily:subjectProfile.family,
    gradeRules:gradeProfile.rules,
    subjectRules:subjectProfile.rules
  };
}

function clean(value,max){ return String(value==null?'':value).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max); }
function matchValue(value){ return ['match','mismatch','uncertain'].includes(value)?value:'uncertain'; }

function sanitizeSourceAssessment(raw){
  raw=raw&&typeof raw==='object'?raw:{};
  return {
    detectedSubject:clean(raw.detectedSubject,160),
    detectedCycle:clean(raw.detectedCycle,80),
    detectedGradeLevel:clean(raw.detectedGradeLevel,160),
    subjectMatch:matchValue(raw.subjectMatch),
    gradeLevelMatch:matchValue(raw.gradeLevelMatch),
    evidence:(Array.isArray(raw.evidence)?raw.evidence:[]).map(x=>clean(x,240)).filter(Boolean).slice(0,5)
  };
}

function assertSourceCompatible(assessment,target){
  const mismatches=[];
  if(assessment.subjectMatch==='mismatch') mismatches.push(`matière détectée : ${assessment.detectedSubject||'différente'}`);
  if(assessment.gradeLevelMatch==='mismatch') mismatches.push(`niveau détecté : ${assessment.detectedGradeLevel||assessment.detectedCycle||'différent'}`);
  if(!mismatches.length)return;
  const error=new Error(`Import bloqué : ce PDF ne correspond pas à « ${target.subjectName} — ${target.gradeLevelName} » (${mismatches.join(' ; ')}). Choisissez l’affectation correcte ou importez un PDF adapté.`);
  error.status=422;
  error.code='COURSE_SOURCE_MISMATCH';
  throw error;
}

function buildTargetPrompt(target){
  return `CIBLE PEDAGOGIQUE AUTORITAIRE\n- Matière exacte : ${target.subjectName} (${target.subjectCode})\n- Famille disciplinaire : ${target.disciplineFamily}\n- Cycle : ${target.cycle}\n- Année exacte : ${target.gradeLevelName} (${target.gradeLevelCode})${target.streamName?`\n- Filière exacte : ${target.streamName}`:''}\n- Adaptation au niveau : ${target.gradeRules}\n- Traitement propre à la matière : ${target.subjectRules}`;
}

module.exports={GRADE_PROFILES,SUBJECT_PROFILES,getCourseTarget,sanitizeSourceAssessment,assertSourceCompatible,buildTargetPrompt};
