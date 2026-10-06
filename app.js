const home = { lat: 37.519, lng: 126.889, label: '우리 집(문래)' }; // 개인정보 보호용 문래 권역 표시점
const styleUrl = 'https://tiles.openfreemap.org/styles/liberty';
const tentSvg = color => `<svg viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="14" fill="${color}" stroke="#f7f1e5" stroke-width="1.8"/><path d="M8.3 23.6 16.9 10l8.8 13.6M12 23.6l4.9-7.3 5 7.3M16.9 16.3v7.3M6.9 24.5h20" fill="none" stroke="#f7f1e5" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const homeSvg = `<svg viewBox="0 0 38 38" aria-hidden="true"><circle cx="19" cy="19" r="15.5" fill="#b77942" stroke="#f7f1e5" stroke-width="1.8"/><path d="m10.1 18 8.9-7.4 8.9 7.4v9.2H10.1zM15.7 27.2v-6.3h6.6v6.3" fill="none" stroke="#fdf8ed" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const tag = (t, c = '') => `<span class="tag ${c}">${t}</span>`;
const naver = item => `https://map.naver.com/p/search/${encodeURIComponent(item.name)}`;
const kakao = item => `https://map.kakao.com/link/from/${encodeURIComponent(home.label)},${home.lat},${home.lng}/to/${encodeURIComponent(item.name)},${item.lat},${item.lng}`;
const marker = (className, svg, label) => { const el=document.createElement('button'); el.type='button'; el.className=className; el.innerHTML=svg; el.setAttribute('aria-label',label); return el; };
const map = new maplibregl.Map({container:'map',style:styleUrl,center:[126.66,37.67],zoom:8.4,attributionControl:true});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');

function safePaint(id, property, value) { if (map.getLayer(id)) map.setPaintProperty(id,property,value); }
function styleEditorialMap() {
  safePaint('background','background-color','#f3f0e7');
  ['park','landcover_wood','landcover_grass','landcover_wetland'].forEach(id=>safePaint(id,'fill-color','#c4d0b8'));
  safePaint('water','fill-color','#c7dfe1');
  ['waterway_river','waterway_other','waterway_tunnel'].forEach(id=>safePaint(id,'line-color','#a9cdd0'));
  ['road_motorway','road_trunk_primary','road_secondary_tertiary','road_minor','road_street','bridge_motorway','bridge_trunk_primary','bridge_secondary_tertiary'].forEach(id=>safePaint(id,'line-color','#ddd8cd'));
  ['boundary_2','boundary_3'].forEach(id=>safePaint(id,'line-color','#90a096'));
  ['label_city','label_town','label_state','label_village'].forEach(id=>safePaint(id,'text-color','#536b5f'));
  ['water_name_point_label','water_name_line_label'].forEach(id=>safePaint(id,'text-color','#719ca1'));
}

map.on('load', async () => {
  styleEditorialMap();
  const [items,routes] = await Promise.all([fetch('data.json').then(r=>r.json()),fetch('routes.json').then(r=>r.json())]);
  const confirmed=items.filter(item=>item.coord==='정확 주소 기반');
  new maplibregl.Marker({element:marker('home-marker',homeSvg,home.label),anchor:'center'}).setLngLat([home.lng,home.lat]).setPopup(new maplibregl.Popup({offset:24}).setHTML(`<article class="popup"><h2>${home.label}</h2><p>개인정보 보호를 위해 실제 주소·좌표와 다른 문래 권역 표시점입니다.</p></article>`)).addTo(map);
  confirmed.forEach(item=>{
    const route=routes[item.name], color=item.operation==='부분 확인'?'#637172':'#1e5841';
    const routeInfo=route?`<div class="route"><b>네이버 자동차 결과 · ${route.km}km / 약 ${route.min}분</b><br><small>${route.checkedAt} 조회 · 실제 출발지 비공개</small></div>`:'';
    const official=item.official?`<a href="${item.official}" target="_blank" rel="noopener">공식 채널 ↗</a>`:'', booking=item.booking?`<a href="${item.booking}" target="_blank" rel="noopener">예약/정보 ↗</a>`:'';
    const html=`<article class="popup"><h2>${item.name}</h2><div class="tags">${tag(item.area)}${tag(item.operation,item.operation==='부분 확인'?'warn':'')}</div>${routeInfo}<p><b>동계 장박</b> · ${item.winter}</p><p><b>가격/기간</b> · ${item.price}</p><p><b>주소</b> · ${item.address}</p><p>${item.note}</p><div class="links"><a href="${naver(item)}" target="_blank" rel="noopener">네이버 지도 ↗</a><a href="${kakao(item)}" target="_blank" rel="noopener">카카오 길찾기 ↗</a>${official}${booking}</div></article>`;
    new maplibregl.Marker({element:marker('camp-marker',tentSvg(color),item.name),anchor:'center'}).setLngLat([item.lng,item.lat]).setPopup(new maplibregl.Popup({offset:23,maxWidth:'332px'}).setHTML(html)).addTo(map);
  });
  const bounds=new maplibregl.LngLatBounds();confirmed.forEach(x=>bounds.extend([x.lng,x.lat]));bounds.extend([home.lng,home.lat]);map.fitBounds(bounds,{padding:52,maxZoom:9.4,duration:0});
  document.querySelector('#count').textContent=`실제 위치·네이버 자동차 결과 확인 ${confirmed.length}개 · 출처·위치 미검증 제외 ${items.length-confirmed.length}개`;
});
