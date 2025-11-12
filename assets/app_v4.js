(async function(){
  function nowStr(){const d=new Date();return d.toLocaleDateString()+' '+d.toLocaleTimeString();}
  function detectType(t){t=(t||'').toLowerCase();if(/acidente|capot|colis/i.test(t))return'Acidente';if(/roubo|assalto/i.test(t))return'Roubo';if(/furto/i.test(t))return'Furto';if(/interdi|bloqueio|obra|manuten/i.test(t))return'Interdição';if(/porto|navio|marítim/i.test(t))return'Porto';if(/sindic/i.test(t))return'Sindicato';if(/internacional|foreign|overseas/i.test(t))return'Internacional';return'Outros';}
  function detectRoad(t){const m=(t||'').match(/BR[-\s]?\d{1,4}|SP[-\s]?\d{1,3}|RODOANEL/i);return m?m[0].toUpperCase().replace(' ','-'):'';}
  function detectRegion(t){t=(t||'').toLowerCase();if(/s[oã]o paulo|sao paulo|minas gerais|rio de janeiro|espirito santo/i.test(t))return'Sudeste';if(/paran[aá]|santa catarina|rio grande do sul/i.test(t))return'Sul';if(/goias|mato grosso|distrito federal/i.test(t))return'Centro-Oeste';if(/bahia|pernambuco|ceara|maranhao/i.test(t))return'Nordeste';if(/acre|amazonas|roraima|rondonia/i.test(t))return'Norte';return'Outras';}

  const loginBtn=document.getElementById('loginBtn'),
        userInp=document.getElementById('user'),
        passInp=document.getElementById('pass'),
        loginMsg=document.getElementById('loginMsg');

  function showApp(){document.getElementById('login-screen').style.display='none';document.getElementById('app').classList.remove('hidden');initApp();}

  loginBtn.addEventListener('click',()=>{const u=userInp.value.trim(),p=passInp.value.trim(); if(u==='adm' && p==='adm'){sessionStorage.setItem('congrl_auth','adm'); showApp(); } else {loginMsg.textContent='Usuário ou senha incorretos'; setTimeout(()=>loginMsg.textContent='',2500);} });
  if(sessionStorage.getItem('congrl_auth')==='adm'){showApp();}

  async function initApp(){
    document.getElementById('now').textContent = nowStr(); setInterval(()=>document.getElementById('now').textContent = nowStr(), 1000);

    // load roads and concessionarias
    const roadSel = document.getElementById('roadFilter');
    const roads = await fetch('data/rodovias.json').then(r=>r.json()).catch(()=>[]);
    roads.forEach(r=>{ const o=document.createElement('option'); o.value=r; o.textContent=r; roadSel.appendChild(o); });

    const concessions = await fetch('data/concessionarias.json').then(r=>r.json()).catch(()=>[]);
    const concesList = document.getElementById('concessList');
    concesList.innerHTML = concessions.map(c=>`<div class="concess" data-site="${c.site}">${c.name}</div>`).join('');
    concesList.addEventListener('click',(e)=>{ const el=e.target.closest('.concess'); if(el && el.dataset.site) window.open(el.dataset.site,'_blank'); });

    // phones
    const phones=[{"name":"Corpo de Bombeiros","site":"https://www.gov.br/defesa-social","tel":"193"},{"name":"Polícia Civil","site":"https://www.gov.br/policia-civil","tel":"181"},{"name":"Polícia Militar","site":"https://www.gov.br/policia-militar","tel":"190"},{"name":"SAMU","site":"https://www.gov.br/samu","tel":"192"},{"name":"PRF","site":"https://www.prf.gov.br","tel":"191"},{"name":"Defesa Civil","site":"https://www.gov.br/defesacivil","tel":"199"}];
    document.getElementById('phonesList').innerHTML = phones.map(p=>`<div class="concess" data-site="${p.site}">${p.name} — ${p.tel}</div>`).join('');
    document.getElementById('phonesList').addEventListener('click',(e)=>{ const el=e.target.closest('.concess'); if(el && el.dataset.site) window.open(el.dataset.site,'_blank'); });

    // charts
    const ctxTypes = document.getElementById('chartTypes').getContext('2d');
    const ctxRegions = document.getElementById('chartRegions').getContext('2d');
    const chartTypes = new Chart(ctxTypes,{type:'bar',data:{labels:[],datasets:[{label:'Ocorrências',data:[],backgroundColor:'#0d47a1'}]},options:{maintainAspectRatio:false}});
    const chartRegions = new Chart(ctxRegions,{type:'doughnut',data:{labels:[],datasets:[{data:[],backgroundColor:['#0d47a1','#1976d2','#42a5f5','#90caf9','#64b5f6']}]},options:{maintainAspectRatio:false}});

    // map
    let map, markers;
    function initMap(){ if(map) return; map = L.map('map',{scrollWheelZoom:false}).setView([-14.2350,-51.9253],4); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map); markers = L.layerGroup().addTo(map); document.getElementById('expandMap').addEventListener('click', ()=> window.open('map.html','_blank')); }

    async function fetchFeeds(){
      const local = await fetch('data/mock_data.json').then(r=>r.json()).catch(()=>null);
      let items = local || [];
      items = items.map(it=>{ it.type = it.type || detectType(it.title+' '+(it.snippet||'')); it.road = it.road || detectRoad(it.title+' '+(it.snippet||'')); it.region = it.region || detectRegion(it.title+' '+(it.snippet||'')); return it; });
      localStorage.setItem('congrl_cache', JSON.stringify({ items: items, fetched: new Date().toISOString() }));
      localStorage.setItem('congrl_used_sources', JSON.stringify(Array.from(new Set(items.map(i=>i.source||'local')))));
      return items;
    }

    function renderNews(list){
      const newsList = document.getElementById('newsList'); newsList.innerHTML='';
      list.forEach(it=>{
        const time = new Date(it.pubDate);
        const timestr = time.toLocaleDateString() + ' ' + time.toLocaleTimeString();
        const div = document.createElement('div'); div.className='news-item';
        div.innerHTML = `<div style="flex:1;min-width:220px"><span class="meta">[${it.type}] ${it.road? '— '+it.road : ''}</span> <a href="${it.link}" target="_blank" rel="noopener">${it.title}</a></div><div class="meta">${it.source} • ${timestr}</div>`;
        div.addEventListener('click', ()=> { if(it.lat && it.lon){ initMap(); map.setView([it.lat,it.lon],11); L.popup().setLatLng([it.lat,it.lon]).setContent(`<strong>${it.title}</strong><br><a href='${it.link}' target='_blank'>Abrir fonte</a>`).openOn(map); } });
        newsList.appendChild(div);
      });
    }

    const feeds = await fetchFeeds();
    renderNews(feeds);

    // stats & charts
    const typesCount = {}, regionsCount = {};
    feeds.forEach(f=>{ typesCount[f.type] = (typesCount[f.type]||0)+1; regionsCount[f.region] = (regionsCount[f.region]||0)+1; });
    document.getElementById('statAcc').textContent = typesCount['Acidente']||0;
    document.getElementById('statInt').textContent = (typesCount['Interdição']||0) + (typesCount['Trânsito']||0);
    document.getElementById('statRoubo').textContent = typesCount['Roubo']||0;
    document.getElementById('statFurto').textContent = typesCount['Furto']||0;

    chartTypes.data.labels = Object.keys(typesCount); chartTypes.data.datasets[0].data = Object.values(typesCount); chartTypes.update();
    chartRegions.data.labels = Object.keys(regionsCount); chartRegions.data.datasets[0].data = Object.values(regionsCount); chartRegions.update();

    initMap();
    markers.clearLayers();
    feeds.forEach(it=>{ if(!it.lat||!it.lon) return; const emoji = it.type==='Acidente'?'A':(it.type==='Interdição'?'I':(it.type==='Roubo'?'R':(it.type==='Furto'?'F':'O'))); const icon = L.divIcon({html:`<div style="background:#0d47a1;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center">${emoji}</div>`,className:''}); L.marker([it.lat,it.lon],{icon}).addTo(markers).bindPopup(`<strong>${it.title}</strong><br><a href='${it.link}' target='_blank'>Abrir fonte</a>`); });

    // CSV
    document.getElementById('csvBtn').addEventListener('click',()=>{
      const rows=[['Data Baixada','Título','Fonte','Data da Notícia','Link','Tipo']];
      feeds.forEach(f=> rows.push([new Date().toISOString(), f.title, f.source||'', f.pubDate||'', f.link||'', f.type||'']));
      const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\\n');
      const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href = url; a.download = 'news_export.csv'; a.click(); URL.revokeObjectURL(url);
    });

    // PDF (simple)
    document.getElementById('pdfBtn').addEventListener('click', async ()=>{
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(16); doc.text('TORRES - Central Operacional News (CON)', 14, 20);
      doc.setFontSize(12); doc.text('Relatório gerado em: ' + new Date().toLocaleString(), 14, 30);
      let y=40;
      feeds.slice(0,10).forEach(f=>{ doc.setFontSize(11); doc.text('- ' + f.title, 14, y); y+=8; if(y>270){ doc.addPage(); y=20; }});
      doc.save('CON_report.pdf');
    });

    // fontes modal
    document.getElementById('fontesBtn').addEventListener('click',()=>{
      const used = JSON.parse(localStorage.getItem('congrl_used_sources')||'[]');
      const list = document.getElementById('fontesList'); list.innerHTML = used.map(u=>`<div style="padding:6px;border-bottom:1px solid #eee">${u}</div>`).join('') || '<div style="padding:6px">Nenhuma fonte</div>';
      document.getElementById('fontesModal').style.display='block';
    });

    document.getElementById('fontesBuscaBtn').addEventListener('click',()=>{
      const fixed = ['G1 (RSS)','Google News','R7','PRF','DNIT','CCR','Concessionárias locais']; document.getElementById('fixedSources').innerHTML = fixed.map(f=>`<li>${f}</li>`).join(''); document.getElementById('fontesBuscaModal').style.display='block';
    });

    document.querySelectorAll('.close, .btn-close').forEach(b=> b.addEventListener('click', e=> document.getElementById(e.target.dataset.for).style.display='none'));

    // ajuda modal
    document.getElementById('ajudaBtn').addEventListener('click',()=>{
      document.getElementById('ajudaBody').innerHTML = '<p>Filtro: selecione Ocorrência, Região ou Rodovia. Use Atualizar para forçar recarga. CSV e PDF geram relatórios. Botão mapa abre mapa em nova aba.</p>';
      document.getElementById('ajudaModal').style.display='block';
    });

    // auto-update 30 minutes
    setInterval(async ()=>{ const f = await fetchFeeds(); renderNews(f); }, 1000*60*30);

  } // initApp
})();
