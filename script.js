// === LOGIN ===
const user=document.getElementById('user'),pass=document.getElementById('pass'),
btn=document.getElementById('loginBtn'),msg=document.getElementById('loginMsg');
btn.onclick=()=>{if(user.value==='adm'&&pass.value==='adm'){sessionStorage.setItem('ok','1');showApp();}
else{msg.textContent='Usuário ou senha incorretos';setTimeout(()=>msg.textContent='',2000)}};
if(sessionStorage.getItem('ok')==='1')showApp();
function showApp(){document.getElementById('login-screen').style.display='none';document.getElementById('app').classList.remove('hidden');initApp();}

async function initApp(){
 document.getElementById('now').textContent=new Date().toLocaleString();
 setInterval(()=>document.getElementById('now').textContent=new Date().toLocaleString(),1000);

 const map=L.map('map').setView([-14.23,-51.9],4);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

 const roads=["BR-101","BR-116","SP-280","SP-310","BR-153","BR-050"];
 roads.forEach(r=>{let o=document.createElement('option');o.textContent=r;o.value=r;document.getElementById('roadFilter').appendChild(o)});

 const concess=[
  {"name":"CCR AutoBAn","site":"https://www.autoban.com.br"},
  {"name":"Ecovias","site":"https://www.ecovias.com.br"},
  {"name":"ViaPaulista","site":"https://www.viapaulista.com.br"},
  {"name":"Arteris","site":"https://www.arteris.com.br"}
 ];
 document.getElementById('concessList').innerHTML=concess.map(c=>`<div><a href="${c.site}" target="_blank">${c.name}</a></div>`).join('');

 const phones=[
  {"name":"Polícia Rodoviária Federal","site":"https://www.gov.br/prf","tel":"191"},
  {"name":"Corpo de Bombeiros","site":"https://www.gov.br/defesa-social","tel":"193"},
  {"name":"SAMU","site":"https://www.gov.br/saude","tel":"192"}
 ];
 document.getElementById('phonesList').innerHTML=phones.map(p=>`<div><a href="${p.site}" target="_blank">${p.name}</a> — ${p.tel}</div>`).join('');

 let news=[
  {"title":"Acidente grave na BR-101 causa interdição","link":"https://g1.globo.com","pubDate":new Date(),"type":"Acidente","region":"Sudeste","road":"BR-101","lat":-23.5,"lon":-46.6,"source":"G1"},
  {"title":"Roubo de carga em SP","link":"https://www.r7.com","pubDate":new Date(),"type":"Roubo","region":"Sudeste","road":"SP-280","lat":-23.3,"lon":-47.1,"source":"R7"}
 ];
 render(news);

 document.getElementById('refreshBtn').onclick=()=>render(news);
 document.getElementById('csvBtn').onclick=()=>downloadCSV(news);
 document.getElementById('occFilter').onchange=()=>filter();
 document.getElementById('regionFilter').onchange=()=>filter();
 document.getElementById('roadFilter').onchange=()=>filter();

 function filter(){
  let o=document.getElementById('occFilter').value,
      r=document.getElementById('regionFilter').value,
      rd=document.getElementById('roadFilter').value;
  let f=news.filter(n=>(!o||n.type===o)&&(!r||n.region===r)&&(!rd||n.road===rd));
  render(f);
 }

 function render(list){
  const box=document.getElementById('newsList'); box.innerHTML='';
  list.forEach(n=>{
   let d=document.createElement('div');d.className='news-item';
   d.innerHTML=`<div><b>${n.type}</b> — <a href="${n.link}" target="_blank">${n.title}</a><br>${n.region} • ${n.road}</div>`;
   box.appendChild(d);
   if(n.lat) L.marker([n.lat,n.lon]).addTo(map).bindPopup(`<a href='${n.link}' target='_blank'>${n.title}</a>`);
  });
 }

 function downloadCSV(list){
  const rows=[["Notícia","Link","Data","Ocorrência","Região","Rodovia"]];
  list.forEach(n=>rows.push([n.title,n.link,new Date(n.pubDate).toLocaleString(),n.type,n.region,n.road]));
  let csv=rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
  let blob=new Blob([csv],{type:"text/csv"});
  let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='noticias.csv';a.click();
 }
}
