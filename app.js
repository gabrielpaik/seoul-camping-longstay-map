const home = { lat: 37.519, lng: 126.889, label: '우리 집(문래)' }; // 개인정보 보호용 문래 권역 표시점
const vectorTiles = 'https://tiles.openfreemap.org/planet/20260927_080001_pt/{z}/{x}/{y}.pbf';
const tentSvg = color => `<svg viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="14" fill="${color}" stroke="#f7f1e5" stroke-width="1.8"/><path d="M8.3 23.6 16.9 10l8.8 13.6M12 23.6l4.9-7.3 5 7.3M16.9 16.3v7.3M6.9 24.5h20" fill="none" stroke="#f7f1e5" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const homeSvg = `<svg viewBox="0 0 38 38" aria-hidden="true"><circle cx="19" cy="19" r="15.5" fill="#b77942" stroke="#f7f1e5" stroke-width="1.8"/><path d="m10.1 18 8.9-7.4 8.9 7.4v9.2H10.1zM15.7 27.2v-6.3h6.6v6.3" fill="none" stroke="#fdf8ed" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const tag = (t, c = '') => `<span class="tag ${c}">${t}</span>`;
const naver = item => `https://map.naver.com/p/search/${encodeURIComponent(item.name)}`;
const kakao = item => `https://map.kakao.com/link/from/${encodeURIComponent(home.label)},${home.lat},${home.lng}/to/${encodeURIComponent(item.name)},${item.lat},${item.lng}`;
const icon = color => L.divIcon({ className:'camp-marker', html:tentSvg(color), iconSize:[34,34], iconAnchor:[17,17], popupAnchor:[0,-18] });
const homeIcon = L.divIcon({ className:'home-marker', html:homeSvg, iconSize:[38,38], iconAnchor:[19,19], popupAnchor:[0,-21] });
const map = L.map('map',{zoomControl:false,scrollWheelZoom:false,preferCanvas:true}).setView([37.67,126.66],8.5);
L.control.zoom({position:'bottomright'}).addTo(map);

// OpenMapTiles/OSM 실제 벡터 지리정보를 캔버스에 편집형 팔레트로 재렌더한다.
L.vectorGrid.protobuf(vectorTiles,{rendererFactory:L.canvas.tile,interactive:false,maxNativeZoom:14,vectorTileLayerStyles:{
  park:{fill:true,fillColor:'#bdcbb2',fillOpacity:.84,stroke:false},
  landcover:{fill:true,fillColor:'#c8d3bd',fillOpacity:.72,stroke:false},
  landuse:{fill:true,fillColor:'#e9e7df',fillOpacity:.46,stroke:false},
  water:{fill:true,fillColor:'#c9dfe1',fillOpacity:1,stroke:false},
  waterway:{color:'#a9cdd0',weight:1.5,opacity:.95},
  transportation:properties=>({color:/motorway|trunk|primary/.test(properties.class||'')?'#cec8bb':'#e5e2da',weight:/motorway|trunk/.test(properties.class||'')?2.1:1,opacity:.88}),
  boundary:{color:'#8fa095',weight:1,opacity:.72,dashArray:'3,3'}
}}).addTo(map);

const cityLabels=[['서울',37.5665,126.978],['인천',37.4563,126.705],['김포',37.615,126.715],['파주',37.7599,126.78],['강화',37.746,126.488],['영종',37.495,126.55]];
cityLabels.forEach(([name,lat,lng])=>L.marker([lat,lng],{interactive:false,icon:L.divIcon({className:'geo-label',html:name,iconSize:[70,18],iconAnchor:[35,9]})}).addTo(map));
L.marker([37.55,126.84],{interactive:false,icon:L.divIcon({className:'water-label',html:'한강',iconSize:[45,18],iconAnchor:[22,9]})}).addTo(map);
L.marker([home.lat,home.lng],{icon:homeIcon,title:home.label,zIndexOffset:1000}).addTo(map).bindPopup(`<article class="popup"><h2>${home.label}</h2><p>개인정보 보호를 위해 실제 주소·좌표와 다른 문래 권역 표시점입니다.</p></article>`);

Promise.all([fetch('data.json').then(r=>r.json()),fetch('routes.json').then(r=>r.json())]).then(([items,routes])=>{
  const confirmed=items.filter(item=>item.coord==='정확 주소 기반');
  confirmed.forEach(item=>{
    const route=routes[item.name]; const color=item.operation==='부분 확인'?'#637172':'#1e5841';
    const routeInfo=route?`<div class="route"><b>네이버 자동차 결과 · ${route.km}km / 약 ${route.min}분</b><br><small>${route.checkedAt} 조회 · 실제 출발지 비공개</small></div>`:'';
    const official=item.official?`<a href="${item.official}" target="_blank" rel="noopener">공식 채널 ↗</a>`:'';
    const booking=item.booking?`<a href="${item.booking}" target="_blank" rel="noopener">예약/정보 ↗</a>`:'';
    const content=`<article class="popup"><h2>${item.name}</h2><div class="tags">${tag(item.area)}${tag(item.operation,item.operation==='부분 확인'?'warn':'')}</div>${routeInfo}<p><b>동계 장박</b> · ${item.winter}</p><p><b>가격/기간</b> · ${item.price}</p><p><b>주소</b> · ${item.address}</p><p>${item.note}</p><div class="links"><a href="${naver(item)}" target="_blank" rel="noopener">네이버 지도 ↗</a><a href="${kakao(item)}" target="_blank" rel="noopener">카카오 길찾기 ↗</a>${official}${booking}</div></article>`;
    L.marker([item.lat,item.lng],{icon:icon(color),title:item.name}).addTo(map).bindPopup(content);
  });
  const bounds=L.latLngBounds(confirmed.map(x=>[x.lat,x.lng]));bounds.extend([home.lat,home.lng]);map.fitBounds(bounds,{padding:[46,46],maxZoom:9.4});
  document.querySelector('#count').textContent=`실제 위치·네이버 자동차 결과 확인 ${confirmed.length}개 · 출처·위치 미검증 제외 ${items.length-confirmed.length}개`;
});
