// 문래 권역의 비정밀 표시점. 실제 주소·좌표는 이 공개 지도에 포함하지 않는다.
const home = { lat: 37.5190, lng: 126.8890, label: '우리 집(문래)' };
const map = L.map('map', { zoomControl: false }).setView([37.63, 126.69], 9.3);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
const statusClass = value => value === '공식/공공 확인' ? 'verified' : value === '부분 확인' ? 'partial' : 'unknown';
const tag = (text, cls = '') => `<span class="tag ${cls}">${text}</span>`;
const naverPlace = item => `https://map.naver.com/p/search/${encodeURIComponent(item.name)}`;
const kakaoDirections = item => `https://map.kakao.com/link/from/${encodeURIComponent(home.label)},${home.lat},${home.lng}/to/${encodeURIComponent(item.name)},${item.lat},${item.lng}`;
const homeIcon = L.divIcon({ className: '', html: '<div class="home-pin"></div>', iconSize:[20,20], iconAnchor:[10,10], popupAnchor:[0,-12] });
L.marker([home.lat, home.lng], { icon: homeIcon, title: home.label, zIndexOffset: 1000 }).addTo(map).bindPopup('<article class="card"><h2>우리 집(문래)</h2><p>개인정보 보호를 위해 실제 주소·좌표와 다른 문래 권역 표시점입니다.</p></article>');
Promise.all([fetch('data.json').then(r => r.json()), fetch('routes.json').then(r => r.json())]).then(([items, routes]) => {
  const bounds = [[home.lat, home.lng]];
  items.forEach(item => {
    const klass = statusClass(item.operation);
    const icon = L.divIcon({ className: '', html: `<div class="pin ${klass}"></div>`, iconSize:[14,14], iconAnchor:[7,14], popupAnchor:[0,-13] });
    const official = item.official ? `<a href="${item.official}" target="_blank" rel="noopener">공식 채널 ↗</a>` : '';
    const booking = item.booking ? `<a href="${item.booking}" target="_blank" rel="noopener">예약/정보 ↗</a>` : '';
    const route = routes[item.name];
    const routeMarkup = route ? `<p class="route"><b>네이버 자동차 결과</b> · ${route.km}km · 약 ${route.min}분<br><small>${route.checkedAt} 조회 · 실시간 재계산 필요</small></p>` : '<p class="route"><b>실제 자동차 경로</b> · 대상 명칭/주소 미확인으로 조회 보류</p>';
    L.marker([item.lat,item.lng],{icon,title:item.name,riseOnHover:true}).addTo(map).bindPopup(`<article class="card"><h2>${item.name}</h2>${tag(item.area)}${tag(item.operation,klass === 'unknown' ? 'bad' : klass === 'partial' ? 'warn' : '')}${tag('좌표: '+item.coord,'warn')}${routeMarkup}<p><b>동계 장박</b> · ${item.winter}</p><p><b>가격/기간</b> · ${item.price}</p><p><b>주소</b> · ${item.address}</p><p>${item.note}</p><div class="links"><a href="${naverPlace(item)}" target="_blank" rel="noopener">네이버 지도 ↗</a><a href="${kakaoDirections(item)}" target="_blank" rel="noopener">카카오 길찾기 ↗</a>${official}${booking}</div></article>`);
    bounds.push([item.lat,item.lng]);
  });
  map.fitBounds(bounds, { padding:[34,34], maxZoom:10 });
  document.getElementById('count').textContent = `${items.length}개 후보 핀 · 네이버 실제 자동차 결과(확인 후보만) 포함`;
});
