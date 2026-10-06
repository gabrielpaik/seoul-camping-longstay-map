const home = { lat: 37.519, lng: 126.889, label: '우리 집(문래)' }; // 개인정보 보호용 문래 권역 표시점
const styleUrl = 'https://tiles.openfreemap.org/styles/liberty';

const tentSvg = color => `<svg viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="14" fill="${color}" stroke="#f7f1e5" stroke-width="1.8"/><path d="M8.3 23.6 16.9 10l8.8 13.6M12 23.6l4.9-7.3 5 7.3M16.9 16.3v7.3M6.9 24.5h20" fill="none" stroke="#f7f1e5" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const homeSvg = `<svg viewBox="0 0 38 38" aria-hidden="true"><circle cx="19" cy="19" r="15.5" fill="#b77942" stroke="#f7f1e5" stroke-width="1.8"/><path d="m10.1 18 8.9-7.4 8.9 7.4v9.2H10.1zM15.7 27.2v-6.3h6.6v6.3" fill="none" stroke="#fdf8ed" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const tag = (t, c = '') => `<span class="tag ${c}">${t}</span>`;
const naver = item => `https://map.naver.com/p/search/${encodeURIComponent(item.name)}`;
const kakao = item => `https://map.kakao.com/link/from/${encodeURIComponent(home.label)},${home.lat},${home.lng}/to/${encodeURIComponent(item.name)},${item.lat},${item.lng}`;

function koreanName() {
  return ['coalesce', ['get', 'name:ko'], ['get', 'name:nonlatin'], ['get', 'name']];
}

function editorialStyle(style) {
  style.transition = { duration: 0, delay: 0 };
  style.layers.forEach(layer => {
    const id = layer.id;
    const paint = layer.paint || (layer.paint = {});
    if (id === 'background') paint['background-color'] = '#f3f0e7';
    if (id === 'natural_earth') { paint['raster-opacity'] = 0.12; paint['raster-saturation'] = -1; paint['raster-contrast'] = -0.25; }
    if (/^park|landcover_(wood|grass|wetland)|landuse_(cemetery|hospital|school)/.test(id)) paint['fill-color'] = '#c5d0b8';
    if (/^water$|^waterway_/.test(id)) { paint[layer.type === 'line' ? 'line-color' : 'fill-color'] = '#c7dfe1'; if (layer.type === 'line') paint['line-opacity'] = 0.9; }
    if (/^landuse_residential|^building|^aeroway/.test(id)) { paint['fill-color'] = '#f1eee5'; paint['fill-opacity'] = id === 'building' ? 0.22 : 0.85; }
    if (/^road_.*casing|^tunnel_.*casing|^bridge_.*casing/.test(id)) { paint['line-color'] = '#e1ded6'; paint['line-opacity'] = 0.78; }
    if (/^road_|^tunnel_|^bridge_/.test(id) && layer.type === 'line' && !/casing/.test(id)) { paint['line-color'] = /motorway|trunk|primary/.test(id) ? '#d6cfc1' : '#ece8de'; paint['line-opacity'] = 0.88; }
    if (/^boundary_/.test(id)) { paint['line-color'] = '#8da094'; paint['line-opacity'] = 0.68; paint['line-dasharray'] = [2, 2]; }
    if (/^poi|^airport|^highway-name|^road_shield|^road_one_way/.test(id) || /rail_hatching/.test(id)) layer.layout = { ...(layer.layout || {}), visibility: 'none' };
    if (/^label_(city|town|state|village)$/.test(id)) { layer.layout = { ...(layer.layout || {}), 'text-field': koreanName(), 'text-font': ['Noto Sans Regular'], 'text-letter-spacing': 0.03 }; paint['text-color'] = '#506b5d'; paint['text-halo-color'] = '#f5f1e8'; paint['text-halo-width'] = 1.1; }
    if (/^water_name/.test(id)) { layer.layout = { ...(layer.layout || {}), 'text-field': koreanName() }; paint['text-color'] = '#7ea9ad'; paint['text-halo-color'] = '#f3f0e7'; paint['text-halo-width'] = 1; }
  });
  return style;
}

function markerElement(className, markup, label) {
  const el = document.createElement('button');
  el.type = 'button'; el.className = className; el.setAttribute('aria-label', label); el.innerHTML = markup;
  el.addEventListener('mouseenter', () => el.classList.add('hover'));
  el.addEventListener('mouseleave', () => el.classList.remove('hover'));
  return el;
}

function popupFor(item, route) {
  const routeInfo = route ? `<div class="route"><b>네이버 자동차 결과 · ${route.km}km / 약 ${route.min}분</b><br><small>${route.checkedAt} 조회 · 실제 출발지 비공개</small></div>` : '';
  const official = item.official ? `<a href="${item.official}" target="_blank" rel="noopener">공식 채널 ↗</a>` : '';
  const booking = item.booking ? `<a href="${item.booking}" target="_blank" rel="noopener">예약/정보 ↗</a>` : '';
  return `<article class="popup"><h2>${item.name}</h2><div class="tags">${tag(item.area)}${tag(item.operation, item.operation === '부분 확인' ? 'warn' : '')}</div>${routeInfo}<p><b>동계 장박</b> · ${item.winter}</p><p><b>가격/기간</b> · ${item.price}</p><p><b>주소</b> · ${item.address}</p><p>${item.note}</p><div class="links"><a href="${naver(item)}" target="_blank" rel="noopener">네이버 지도 ↗</a><a href="${kakao(item)}" target="_blank" rel="noopener">카카오 길찾기 ↗</a>${official}${booking}</div></article>`;
}

Promise.all([fetch(styleUrl).then(r => r.json()), fetch('data.json').then(r => r.json()), fetch('routes.json').then(r => r.json())]).then(([style, items, routes]) => {
  const map = new maplibregl.Map({ container: 'map', style: editorialStyle(style), center: [126.66, 37.67], zoom: 8.5, attributionControl: true });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
  const confirmed = items.filter(item => item.coord === '정확 주소 기반');
  const homePopup = new maplibregl.Popup({ offset: 24 }).setHTML(`<article class="popup"><h2>${home.label}</h2><p>개인정보 보호를 위해 실제 주소·좌표와 다른 문래 권역 표시점입니다.</p></article>`);
  new maplibregl.Marker({ element: markerElement('home-marker', homeSvg, home.label), anchor: 'center' }).setLngLat([home.lng, home.lat]).setPopup(homePopup).addTo(map);
  confirmed.forEach(item => {
    const color = item.operation === '부분 확인' ? '#637172' : '#1e5841';
    const popup = new maplibregl.Popup({ offset: 23, maxWidth: '332px' }).setHTML(popupFor(item, routes[item.name]));
    new maplibregl.Marker({ element: markerElement('camp-marker', tentSvg(color), item.name), anchor: 'center' }).setLngLat([item.lng, item.lat]).setPopup(popup).addTo(map);
  });
  const bounds = new maplibregl.LngLatBounds();
  confirmed.forEach(item => bounds.extend([item.lng, item.lat]));
  bounds.extend([home.lng, home.lat]);
  map.fitBounds(bounds, { padding: 52, maxZoom: 9.4, duration: 0 });
  document.querySelector('#count').textContent = `실제 위치·네이버 자동차 결과 확인 ${confirmed.length}개 · 출처·위치 미검증 제외 ${items.length - confirmed.length}개`;
}).catch(() => { document.querySelector('#count').textContent = '지리 데이터 로딩에 실패했습니다. 새로고침해 주세요.'; });
