const home = { lat: 37.5163, lng: 126.8958, label: '우리 집(문래동)' };
const map = L.map('map', { zoomControl: false }).setView([37.63, 126.69], 9.3);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
const statusClass = value => value === '공식/공공 확인' ? 'verified' : value === '부분 확인' ? 'partial' : 'unknown';
const tag = (text, cls = '') => `<span class="tag ${cls}">${text}</span>`;
const radians = value => value * Math.PI / 180;
const roadEstimate = item => {
  const r = 6371;
  const a = Math.sin(radians(item.lat - home.lat) / 2) ** 2 + Math.cos(radians(home.lat)) * Math.cos(radians(item.lat)) * Math.sin(radians(item.lng - home.lng) / 2) ** 2;
  const straight = 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = Math.round(straight * 1.32);
  return { km, min: Math.round(km / 45 * 60 + 12) };
};
const naverDirections = item => `https://map.naver.com/p/directions/${home.lng},${home.lat},${encodeURIComponent(home.label)},PLACE_POI/${item.lng},${item.lat},${encodeURIComponent(item.name)},PLACE_POI/car`;
const kakaoDirections = item => `https://map.kakao.com/link/from/${encodeURIComponent(home.label)},${home.lat},${home.lng}/to/${encodeURIComponent(item.name)},${item.lat},${item.lng}`;
const homeIcon = L.divIcon({ className: '', html: '<div class="home-pin"></div>', iconSize:[20,20], iconAnchor:[10,10], popupAnchor:[0,-12] });
L.marker([home.lat, home.lng], { icon: homeIcon, title: home.label, zIndexOffset: 1000 }).addTo(map).bindPopup('<article class="card"><h2>우리 집(문래동)</h2><p>개인정보 보호를 위해 정확한 주소가 아닌 문래동 권역 중심 핀입니다.</p></article>');
fetch('data.json').then(r => r.json()).then(items => {
  const bounds = [[home.lat, home.lng]];
  items.forEach(item => {
    const klass = statusClass(item.operation);
    const icon = L.divIcon({ className: '', html: `<div class="pin ${klass}"></div>`, iconSize:[14,14], iconAnchor:[7,14], popupAnchor:[0,-13] });
    const official = item.official ? `<a href="${item.official}" target="_blank" rel="noopener">공식 채널 ↗</a>` : '';
    const booking = item.booking ? `<a href="${item.booking}" target="_blank" rel="noopener">예약/정보 ↗</a>` : '';
    const route = roadEstimate(item);
    L.marker([item.lat,item.lng],{icon,title:item.name,riseOnHover:true}).addTo(map).bindPopup(`<article class="card"><h2>${item.name}</h2>${tag(item.area)}${tag(item.operation,klass === 'unknown' ? 'bad' : klass === 'partial' ? 'warn' : '')}${tag('좌표: '+item.coord,'warn')}<p class="route"><b>문래동 출발 추정</b> · ${route.km}km · 약 ${route.min}분<br><small>직선거리×1.32 / 45km/h + 12분, 실시간 교통 미반영</small></p><p><b>동계 장박</b> · ${item.winter}</p><p><b>가격/기간</b> · ${item.price}</p><p><b>주소</b> · ${item.address}</p><p>${item.note}</p><div class="links"><a href="${naverDirections(item)}" target="_blank" rel="noopener">네이버 길찾기 ↗</a><a href="${kakaoDirections(item)}" target="_blank" rel="noopener">카카오 길찾기 ↗</a>${official}${booking}</div></article>`);
    bounds.push([item.lat,item.lng]);
  });
  map.fitBounds(bounds, { padding:[34,34], maxZoom:10 });
  document.getElementById('count').textContent = `${items.length}개 후보 핀 · 문래동 출발 차량 추정 포함`;
});
