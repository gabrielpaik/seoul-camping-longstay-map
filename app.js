const map = L.map('map', { zoomControl: false }).setView([37.63, 126.69], 9.3);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
const statusClass = value => value === '공식/공공 확인' ? 'verified' : value === '부분 확인' ? 'partial' : 'unknown';
const tag = (text, cls = '') => `<span class="tag ${cls}">${text}</span>`;
fetch('data.json').then(r => r.json()).then(items => {
  const bounds = [];
  items.forEach(item => {
    const klass = statusClass(item.operation);
    const icon = L.divIcon({ className: '', html: `<div class="pin ${klass}"></div>`, iconSize:[14,14], iconAnchor:[7,14], popupAnchor:[0,-13] });
    const official = item.official ? `<a href="${item.official}" target="_blank" rel="noopener">공식 채널 ↗</a>` : '';
    const booking = item.booking ? `<a href="${item.booking}" target="_blank" rel="noopener">예약/정보 ↗</a>` : '';
    const winterClass = item.winter === '공개 근거 없음' ? 'bad' : 'warn';
    L.marker([item.lat,item.lng],{icon,title:item.name,riseOnHover:true}).addTo(map).bindPopup(`<article class="card"><h2>${item.name}</h2>${tag(item.area)}${tag(item.operation,klass === 'unknown' ? 'bad' : klass === 'partial' ? 'warn' : '')}${tag('좌표: '+item.coord,'warn')}<p><b>동계 장박</b> · ${item.winter}</p><p><b>가격/기간</b> · ${item.price}</p><p><b>주소</b> · ${item.address}</p><p>${item.note}</p><div class="links">${official}${booking}</div></article>`);
    bounds.push([item.lat,item.lng]);
  });
  map.fitBounds(bounds, { padding:[34,34], maxZoom:10 });
  document.getElementById('count').textContent = `${items.length}개 후보 핀 · 운영/주소/동계 장박 검증 상태 포함`;
});
